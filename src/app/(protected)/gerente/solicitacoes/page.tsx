import type { Metadata } from 'next';
import { Inbox } from 'lucide-react';
import { BotaoAcao } from '@/components/features/botao-acao';
import { ModalFormulario } from '@/components/features/formulario-generico';
import { PageHeader } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { exigirCasaGestor } from '@/lib/auth';
import { listarResidentesCasa } from '@/lib/dados';
import { createClient } from '@/lib/supabase/server';
import { formatarData, formatarTelefone } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Solicitações' };

interface Sol {
  id: string; tipo: 'ENTRADA' | 'VINCULO'; residente_nome: string; residente_data_nascimento: string | null; parentesco: string | null;
  mensagem: string | null; status: 'PENDENTE' | 'APROVADA' | 'RECUSADA'; motivo_recusa: string | null; data_solicitacao: string;
  usuario: { nome_completo: string; email: string; telefone: string } | null;
}
const TOM = { PENDENTE: 'aviso', APROVADA: 'ok', RECUSADA: 'perigo' } as const;
const ROTULO = { PENDENTE: 'Pendente', APROVADA: 'Aprovada', RECUSADA: 'Recusada' } as const;

export default async function SolicitacoesGestor() {
  const { casa } = await exigirCasaGestor();
  const supabase = await createClient();
  const [{ data }, residentes] = await Promise.all([
    supabase.from('adesoes_ilpi')
      .select('id, tipo, residente_nome, residente_data_nascimento, parentesco, mensagem, status, motivo_recusa, data_solicitacao, usuario:usuarios(nome_completo, email, telefone)')
      .eq('ilpi_id', casa.id).order('data_solicitacao', { ascending: false }).limit(100),
    listarResidentesCasa(supabase, casa.id, { status: 'ATIVO' }),
  ]);
  const lista = (data ?? []) as unknown as Sol[];
  const pendentes = lista.filter((s) => s.status === 'PENDENTE');
  const respondidas = lista.filter((s) => s.status !== 'PENDENTE');

  const card = (s: Sol) => (
    <li key={s.id} className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{s.tipo === 'ENTRADA' ? 'Entrada de residente' : 'Acesso a residente'}: {s.residente_nome}</p>
        <Badge tom={TOM[s.status]}>{ROTULO[s.status]}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">
        {s.usuario?.nome_completo} ({s.parentesco ?? 'parentesco não informado'}) · {s.usuario?.email}{s.usuario?.telefone ? ` · ${formatarTelefone(s.usuario.telefone)}` : ''} · enviada em {formatarData(s.data_solicitacao)}
      </p>
      {s.residente_data_nascimento && <p className="text-sm text-muted">Nascimento do residente: {formatarData(s.residente_data_nascimento)}</p>}
      {s.mensagem && <p className="mt-2 whitespace-pre-line">{s.mensagem}</p>}
      {s.motivo_recusa && <p className="mt-2 text-sm"><strong>Motivo da recusa:</strong> {s.motivo_recusa}</p>}
      {s.status === 'PENDENTE' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {s.tipo === 'ENTRADA' ? (
            <BotaoAcao rotulo="Aprovar e cadastrar residente" variante="primario"
              acao={{ tipo: 'rpc', nome: 'responder_solicitacao', args: { p_id: s.id, p_aprovar: true, p_residente: null, p_motivo: null } }}
              confirmar="Aprovar? O residente será cadastrado na casa e o familiar será vinculado. Depois, complete alergias e tipo sanguíneo." />
          ) : (
            <ModalFormulario rotuloBotao="Aprovar e vincular" titulo="Vincular ao residente" variante="primario" rotuloEnvio="Aprovar" mensagemSucesso="Solicitação aprovada."
              campos={[{ nome: 'p_residente', rotulo: 'Residente que será vinculado', tipo: 'select', obrigatorio: true, opcoes: residentes.map((r) => ({ valor: r.id, rotulo: r.nome_completo })), dica: `Nome informado pelo familiar: ${s.residente_nome}` }]}
              acao={{ tipo: 'rpc', nome: 'responder_solicitacao', extra: { p_id: s.id, p_aprovar: true, p_motivo: null } }} />
          )}
          <ModalFormulario rotuloBotao="Recusar" titulo="Recusar solicitação" variante="contorno" rotuloEnvio="Recusar" mensagemSucesso="Solicitação recusada."
            campos={[{ nome: 'p_motivo', rotulo: 'Motivo (será exibido ao familiar)', tipo: 'textarea', maxLen: 300 }]}
            acao={{ tipo: 'rpc', nome: 'responder_solicitacao', extra: { p_id: s.id, p_aprovar: false, p_residente: null } }} />
        </div>
      )}
    </li>
  );

  return (
    <>
      <PageHeader titulo="Solicitações" descricao="Pedidos de familiares para entrada de residentes ou acesso a residentes da casa." />
      {lista.length === 0 && <EmptyState icone={<Inbox className="size-10" />} titulo="Nenhuma solicitação por enquanto" descricao="Quando um familiar enviar um pedido pelo diretório, ele aparecerá aqui." />}
      {pendentes.length > 0 && (<><h2 className="mb-3 text-xl font-bold">Pendentes ({pendentes.length})</h2><ul className="space-y-3">{pendentes.map(card)}</ul></>)}
      {respondidas.length > 0 && (<><h2 className="mb-3 mt-8 text-xl font-bold">Respondidas</h2><ul className="space-y-3">{respondidas.map(card)}</ul></>)}
    </>
  );
}
