import type { Metadata } from 'next';
import { Inbox } from 'lucide-react';
import { ModalFormulario, type CampoConfig } from '@/components/features/formulario-generico';
import { Card, PageHeader } from '@/components/ui/card';
import { Alert, Badge, EmptyState } from '@/components/ui/feedback';
import { exigirSessao } from '@/lib/auth';
import { primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { PARENTESCOS } from '@/utils/constants';
import { formatarData, formatarDataHora } from '@/utils/formatters';
import { ehUUID } from '@/utils/validators';

export const metadata: Metadata = { title: 'Solicitações' };

interface Solicitacao {
  id: string; tipo: 'ENTRADA' | 'VINCULO'; residente_nome: string; status: 'PENDENTE' | 'APROVADA' | 'RECUSADA';
  motivo_recusa: string | null; data_solicitacao: string; data_resposta: string | null; ilpi: { nome_fantasia: string } | null;
}

const TOM = { PENDENTE: 'aviso', APROVADA: 'ok', RECUSADA: 'perigo' } as const;
const ROTULO = { PENDENTE: 'Em análise', APROVADA: 'Aprovada', RECUSADA: 'Recusada' } as const;

export default async function SolicitacoesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sessao = await exigirSessao();
  const casaParam = primeiro((await searchParams).casa);
  const supabase = await createClient();

  const [{ data: sol }, { data: casasData }] = await Promise.all([
    supabase
      .from('adesoes_ilpi')
      .select('id, tipo, residente_nome, status, motivo_recusa, data_solicitacao, data_resposta, ilpi:ilpis(nome_fantasia)')
      .eq('usuario_id', sessao.id)
      .order('data_solicitacao', { ascending: false })
      .limit(50),
    supabase.from('ilpis').select('id, nome_fantasia, cidade, uf').eq('publicada', true).order('nome_fantasia').limit(300),
  ]);
  const lista = (sol ?? []) as unknown as Solicitacao[];
  const casas = (casasData ?? []) as { id: string; nome_fantasia: string; cidade: string; uf: string }[];
  const opcoesCasa = casas.map((c) => ({ valor: c.id, rotulo: `${c.nome_fantasia} · ${c.cidade}/${c.uf}` }));
  const casaInicial = ehUUID(casaParam) && casas.some((c) => c.id === casaParam) ? casaParam : '';

  const base = (obrigatorioNascimento: boolean): CampoConfig[] => [
    { nome: 'ilpi_id', rotulo: 'Casa de repouso', tipo: 'select', obrigatorio: true, opcoes: opcoesCasa, inicial: casaInicial },
    { nome: 'residente_nome', rotulo: 'Nome completo do residente', obrigatorio: true },
    { nome: 'residente_data_nascimento', rotulo: 'Data de nascimento', tipo: 'data', obrigatorio: obrigatorioNascimento, largura: 'metade' },
    { nome: 'residente_sexo', rotulo: 'Sexo', tipo: 'select', largura: 'metade', opcoes: [{ valor: 'F', rotulo: 'Feminino' }, { valor: 'M', rotulo: 'Masculino' }, { valor: 'O', rotulo: 'Outro' }] },
    { nome: 'parentesco', rotulo: 'Seu parentesco', tipo: 'select', obrigatorio: true, opcoes: PARENTESCOS.map((p) => ({ valor: p, rotulo: p })) },
    { nome: 'mensagem', rotulo: 'Mensagem para a casa (opcional)', tipo: 'textarea', maxLen: 500 },
  ];

  return (
    <>
      <PageHeader titulo="Solicitações" descricao="Peça a entrada de um novo residente ou o acesso a um residente que já mora em uma casa de repouso. O gestor da casa analisa o pedido." />

      <Card>
        <div className="flex flex-wrap gap-3">
          <ModalFormulario
            rotuloBotao="Solicitar entrada de residente" titulo="Solicitar entrada de residente"
            descricao="Informe os dados da pessoa que deseja acolher. A casa entrará em contato após analisar."
            rotuloEnvio="Enviar solicitação" mensagemSucesso="Solicitação enviada. Acompanhe a resposta nesta página."
            campos={base(true)} acao={{ tipo: 'insert', tabela: 'adesoes_ilpi', extra: { usuario_id: sessao.id, tipo: 'ENTRADA' } }}
          />
          <ModalFormulario
            rotuloBotao="Pedir acesso a um residente" titulo="Pedir acesso a um residente"
            descricao="Use quando o seu familiar já mora na casa e você ainda não consegue acompanhá-lo no Ginkle."
            variante="contorno" rotuloEnvio="Enviar solicitação" mensagemSucesso="Solicitação enviada. Acompanhe a resposta nesta página."
            campos={base(false)} acao={{ tipo: 'insert', tabela: 'adesoes_ilpi', extra: { usuario_id: sessao.id, tipo: 'VINCULO' } }}
          />
        </div>
        {casas.length === 0 && <div className="mt-4"><Alert tipo="aviso">Ainda não há casas de repouso publicadas para receber solicitações.</Alert></div>}
      </Card>

      <h2 className="mb-3 mt-8 text-xl font-bold">Meus pedidos</h2>
      {lista.length === 0 ? (
        <EmptyState icone={<Inbox className="size-10" />} titulo="Nenhuma solicitação enviada" descricao="Quando você enviar um pedido, ele aparecerá aqui com o andamento." />
      ) : (
        <ul className="space-y-3">
          {lista.map((s) => (
            <li key={s.id} className="rounded-xl border border-line bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{s.tipo === 'ENTRADA' ? 'Entrada de residente' : 'Acesso a residente'}: {s.residente_nome}</p>
                <Badge tom={TOM[s.status]}>{ROTULO[s.status]}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted">{s.ilpi?.nome_fantasia ?? 'Casa de repouso'} · enviada em {formatarData(s.data_solicitacao)}{s.data_resposta ? ` · respondida em ${formatarDataHora(s.data_resposta).slice(0, 10)}` : ''}</p>
              {s.motivo_recusa && <p className="mt-2 text-sm"><strong>Motivo informado:</strong> {s.motivo_recusa}</p>}
              {s.status === 'APROVADA' && <p className="mt-2 text-sm text-ok">Aprovada. O residente já aparece em “Meus familiares”.</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
