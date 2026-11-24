import type { NextRequest } from 'next/server';
import { getSessao } from '@/lib/auth';
import { carregarResidente } from '@/lib/dados';
import { gerarPdf, respostaPdf, type SecaoPdf } from '@/lib/pdf';
import { buscarRegistros } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { PERIODOS, SITUACOES_MEDICACAO, TIPOS_REGISTRO } from '@/utils/constants';
import { calcularIdade, formatarData, formatarDataHora, hojeISO } from '@/utils/formatters';
import { ehUUID } from '@/utils/validators';
import { chipsVitais } from '@/components/features/registro-item';

/** Relatório do residente em PDF (para arquivamento pela família ou pela casa). O acesso segue as regras do banco. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessao())) return new Response('Faça login para baixar o relatório.', { status: 401 });
  const { id } = await params;
  if (!ehUUID(id)) return new Response('Residente não encontrado.', { status: 404 });

  const pedido = request.nextUrl.searchParams.get('periodo') ?? '30d';
  const periodo = PERIODOS.some((p) => p.valor === pedido) ? pedido : '30d';
  const rotuloPeriodo = PERIODOS.find((p) => p.valor === periodo)?.rotulo ?? '';

  const supabase = await createClient();
  const r = await carregarResidente(supabase, id);
  if (!r) return new Response('Residente não encontrado ou sem permissão.', { status: 404 });

  const { itens } = await buscarRegistros(supabase, { residenteId: id, periodo, limite: 500 });
  const registros = [...itens].reverse(); // do mais antigo ao mais recente
  const por = (tipo: string) => registros.filter((x) => x.tipo === tipo);
  const resp = (x: { autor_nome: string }) => x.autor_nome;
  const dh = (iso: string) => formatarDataHora(iso);

  const resumo = (Object.entries(TIPOS_REGISTRO) as [string, string][]).map(([k, rot]) => `${rot}: ${por(k).length}`).join(' · ');
  const urgentes = registros.filter((x) => x.urgente).length;

  const secoes: SecaoPdf[] = [
    {
      titulo: 'Dados do residente',
      paragrafos: [
        `Nome: ${r.nome_completo}`,
        `Idade: ${calcularIdade(r.data_nascimento)} anos (nascimento em ${formatarData(r.data_nascimento)})`,
        `Casa de repouso: ${r.ilpi ? `${r.ilpi.nome_fantasia} - ${r.ilpi.cidade}/${r.ilpi.uf}` : '-'}${r.quarto ? ` · Quarto ${r.quarto}` : ''}`,
        `Tipo sanguíneo: ${r.tipo_sanguineo === 'DESCONHECIDO' ? 'não informado' : r.tipo_sanguineo} · Alergias: ${r.alergias}`,
        ...(r.observacoes_medicas ? [`Observações médicas: ${r.observacoes_medicas}`] : []),
      ],
    },
    {
      titulo: `Resumo do período (${rotuloPeriodo.toLowerCase()})`,
      paragrafos: [`Total de registros: ${registros.length}. ${resumo}.`, `Ocorrências marcadas como urgentes: ${urgentes}.`],
    },
    {
      titulo: 'Sinais vitais',
      vazio: 'Nenhuma medição no período.',
      tabela: { colunas: [{ titulo: 'Data e hora', largura: 0.2 }, { titulo: 'Medições', largura: 0.55 }, { titulo: 'Registrado por', largura: 0.25 }], linhas: por('SINAIS_VITAIS').map((x) => [dh(x.criado_em_dispositivo), chipsVitais(x.dados).join(' | ') || x.descricao, resp(x)]) },
    },
    {
      titulo: 'Medicação',
      vazio: 'Nenhum registro de medicação no período.',
      tabela: { colunas: [{ titulo: 'Data e hora', largura: 0.18 }, { titulo: 'Medicamento / dose', largura: 0.27 }, { titulo: 'Lote', largura: 0.1 }, { titulo: 'Situação', largura: 0.17 }, { titulo: 'Responsável', largura: 0.28 }], linhas: por('MEDICACAO').map((x) => [dh(x.criado_em_dispositivo), `${x.medicamento ?? x.titulo}${x.dose ? ` - ${x.dose}` : ''}`, x.lote ?? '-', `${x.situacao ? SITUACOES_MEDICACAO[x.situacao] : '-'}${x.assinado ? ' (assinado)' : ''}`, resp(x)]) },
    },
    {
      titulo: 'Ocorrências',
      vazio: 'Nenhuma ocorrência no período.',
      tabela: { colunas: [{ titulo: 'Data e hora', largura: 0.18 }, { titulo: 'Ocorrência', largura: 0.22 }, { titulo: 'Descrição e providências', largura: 0.4 }, { titulo: 'Responsável', largura: 0.2 }], linhas: por('OCORRENCIA').map((x) => [dh(x.criado_em_dispositivo), `${x.urgente ? '[URGENTE] ' : ''}${x.titulo}`, x.descricao, resp(x)]) },
    },
    {
      titulo: 'Cuidados',
      vazio: 'Nenhum cuidado registrado no período.',
      tabela: { colunas: [{ titulo: 'Data e hora', largura: 0.18 }, { titulo: 'Tipo', largura: 0.2 }, { titulo: 'Descrição', largura: 0.42 }, { titulo: 'Responsável', largura: 0.2 }], linhas: por('CUIDADO').map((x) => [dh(x.criado_em_dispositivo), x.categoria ?? x.titulo, x.descricao, resp(x)]) },
    },
  ];

  const bytes = await gerarPdf({
    titulo: `Relatório de cuidados - ${r.nome_completo}`,
    subtitulo: `Período: ${rotuloPeriodo}. Os registros foram feitos pela equipe da casa de repouso e não podem ser alterados.`,
    secoes,
    rodape: 'Relatório de cuidados · Ginkle',
  });
  return respostaPdf(bytes, `relatorio-${r.nome_completo}-${hojeISO()}.pdf`);
}
