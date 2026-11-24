import { NextResponse, type NextRequest } from 'next/server';
import { criarAdmin } from '@/lib/admin';
import { getSessao } from '@/lib/auth';
import { enviarPush } from '@/lib/push';
import { createClient } from '@/lib/supabase/server';
import { ehUUID } from '@/utils/validators';

/**
 * Chamada pelo navegador logo depois de enviar uma mensagem ou registrar uma ocorrência urgente.
 * O servidor confere (com a sessão da pessoa) que o item existe e que ela é a autora, e só então notifica.
 */
export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: 'sessao' }, { status: 401 });
  const corpo = (await request.json().catch(() => null)) as { tipo?: string; id?: string } | null;
  if (!corpo?.id || !ehUUID(corpo.id) || !['mensagem', 'registro', 'solicitacao_nova', 'solicitacao_resposta'].includes(corpo.tipo ?? '')) return NextResponse.json({ erro: 'dados' }, { status: 400 });

  const admin = criarAdmin();
  if (!admin) return NextResponse.json({ enviados: 0, motivo: 'push-nao-configurado' });
  const supabase = await createClient();

  if (corpo.tipo === 'mensagem') {
    const { data: m } = await supabase
      .from('mensagens')
      .select('id, conversa_id, remetente_id, remetente_nome, remetente_equipe, conteudo')
      .eq('id', corpo.id)
      .maybeSingle();
    const msg = m as { conversa_id: string; remetente_id: string; remetente_nome: string; remetente_equipe: boolean; conteudo: string } | null;
    if (!msg || msg.remetente_id !== sessao.id) return NextResponse.json({ erro: 'nao-encontrado' }, { status: 404 });

    const { data: c } = await admin.from('conversas').select('ilpi_id, usuario_id, ilpi:ilpis(nome_fantasia)').eq('id', msg.conversa_id).maybeSingle();
    const conversa = c as unknown as { ilpi_id: string; usuario_id: string; ilpi: { nome_fantasia: string } | null } | null;
    if (!conversa) return NextResponse.json({ enviados: 0 });
    const corpoCurto = msg.conteudo.length > 120 ? `${msg.conteudo.slice(0, 117)}...` : msg.conteudo;

    if (msg.remetente_equipe) {
      const n = await enviarPush(
        [conversa.usuario_id],
        { titulo: `Mensagem de ${conversa.ilpi?.nome_fantasia ?? 'casa de repouso'}`, corpo: corpoCurto, url: `/cliente/chat?casa=${conversa.ilpi_id}` },
        'push_chat',
      );
      return NextResponse.json({ enviados: n });
    }

    const { data: equipe } = await admin.from('vinculos_ilpi').select('usuario_id, cargo').eq('ilpi_id', conversa.ilpi_id).eq('ativo', true);
    const lista = (equipe ?? []) as { usuario_id: string; cargo: string }[];
    const titulo = `Nova mensagem de ${msg.remetente_nome}`;
    const gestores = lista.filter((x) => x.cargo === 'GESTOR').map((x) => x.usuario_id);
    const demais = lista.filter((x) => x.cargo !== 'GESTOR').map((x) => x.usuario_id);
    const [a, b] = await Promise.all([
      enviarPush(gestores, { titulo, corpo: corpoCurto, url: `/gerente/chat?conversa=${msg.conversa_id}` }, 'push_chat'),
      enviarPush(demais, { titulo, corpo: corpoCurto, url: `/funcionario/chat?conversa=${msg.conversa_id}` }, 'push_chat'),
    ]);
    return NextResponse.json({ enviados: a + b });
  }

  if (corpo.tipo === 'solicitacao_nova') {
    const { data: solicitacao } = await supabase
      .from('adesoes_ilpi')
      .select('id, usuario_id, ilpi_id, tipo, residente_nome')
      .eq('id', corpo.id)
      .eq('usuario_id', sessao.id)
      .maybeSingle();
    const sol = solicitacao as { usuario_id: string; ilpi_id: string; tipo: string; residente_nome: string } | null;
    if (!sol) return NextResponse.json({ erro: 'nao-encontrado' }, { status: 404 });

    const { data: equipe, error: erroEquipe } = await admin
      .from('vinculos_ilpi').select('usuario_id')
      .eq('ilpi_id', sol.ilpi_id).eq('cargo', 'GESTOR').eq('ativo', true);
    if (erroEquipe) {
      console.error('[push] Falha ao localizar gestores da solicitação:', erroEquipe);
      return NextResponse.json({ enviados: 0, motivo: 'falha-ao-localizar-gestores' }, { status: 500 });
    }
    const gestores = ((equipe ?? []) as { usuario_id: string }[]).map((x) => x.usuario_id);
    const tipo = sol.tipo === 'ENTRADA' ? 'entrada de residente' : 'acesso a residente';
    const n = await enviarPush(gestores, {
      titulo: 'Nova solicitação no Ginkle',
      corpo: `Pedido de ${tipo}: ${sol.residente_nome}`,
      url: '/gerente/solicitacoes',
    }, 'push_solicitacoes');
    return NextResponse.json({ enviados: n });
  }

  if (corpo.tipo === 'solicitacao_resposta') {
    const { data: solicitacao } = await admin
      .from('adesoes_ilpi')
      .select('id, usuario_id, ilpi_id, tipo, residente_nome, status, motivo_recusa')
      .eq('id', corpo.id).maybeSingle();
    const sol = solicitacao as { usuario_id: string; ilpi_id: string; tipo: string; residente_nome: string; status: string; motivo_recusa: string | null } | null;
    if (!sol || sol.status === 'PENDENTE') return NextResponse.json({ erro: 'solicitacao-nao-respondida' }, { status: 404 });

    const { data: vinculo } = await admin.from('vinculos_ilpi').select('id')
      .eq('usuario_id', sessao.id).eq('ilpi_id', sol.ilpi_id).eq('cargo', 'GESTOR').eq('ativo', true).maybeSingle();
    if (!vinculo) return NextResponse.json({ erro: 'nao-autorizado' }, { status: 403 });

    const aprovada = sol.status === 'APROVADA';
    const tipo = sol.tipo === 'ENTRADA' ? 'entrada de residente' : 'acesso a residente';
    const n = await enviarPush([sol.usuario_id], {
      titulo: aprovada ? 'Solicitação aprovada' : 'Solicitação recusada',
      corpo: aprovada ? `Seu pedido de ${tipo} para ${sol.residente_nome} foi aprovado.` :
        `Seu pedido de ${tipo} para ${sol.residente_nome} foi recusado.${sol.motivo_recusa ? ` Motivo: ${sol.motivo_recusa}` : ''}`,
      url: '/cliente/solicitacoes',
    }, 'push_solicitacoes');
    return NextResponse.json({ enviados: n });
  }

  if (corpo.tipo === 'registro') {
    const { data: r } = await supabase
      .from('registros_assistenciais')
      .select('id, residente_id, urgente, titulo, autor_id, residente:residentes(nome_completo)')
      .eq('id', corpo.id)
      .maybeSingle();
    const reg = r as unknown as { residente_id: string; urgente: boolean; titulo: string; autor_id: string; residente: { nome_completo: string } | null } | null;
    if (!reg || reg.autor_id !== sessao.id || !reg.urgente) return NextResponse.json({ erro: 'nao-encontrado' }, { status: 404 });

    const { data: fam } = await admin.from('familiares_residentes').select('usuario_id').eq('residente_id', reg.residente_id);
    const ids = ((fam ?? []) as { usuario_id: string }[]).map((f) => f.usuario_id);
    const n = await enviarPush(
      ids,
      { titulo: `Ocorrência urgente: ${reg.residente?.nome_completo ?? 'residente'}`, corpo: reg.titulo, url: `/cliente/residentes/${reg.residente_id}` },
      'push_urgente',
    );
    return NextResponse.json({ enviados: n });
  }

  return NextResponse.json({ erro: 'tipo' }, { status: 400 });
}
