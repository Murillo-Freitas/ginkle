import type { Metadata } from 'next';
import { Wallet } from 'lucide-react';
import { Card, PageHeader, Stat } from '@/components/ui/card';
import { Alert, Badge, EmptyState } from '@/components/ui/feedback';
import { exigirSessao } from '@/lib/auth';
import { listarFamiliares, statusMensalidade } from '@/lib/dados';
import { createClient } from '@/lib/supabase/server';
import { formatarCompetencia, formatarData, formatarMoeda, hojeISO } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Financeiro' };

interface Mensalidade {
  id: string; competencia: string; valor: number; data_vencimento: string; status: string;
  data_pagamento: string | null; forma_pagamento: string | null; numero_recibo: number | null; residente: { nome_completo: string } | null;
}

export default async function FinanceiroFamiliar() {
  const sessao = await exigirSessao();
  const supabase = await createClient();
  const [familiares, { data }] = await Promise.all([
    listarFamiliares(supabase, sessao.id),
    supabase
      .from('mensalidades')
      .select('id, competencia, valor, data_vencimento, status, data_pagamento, forma_pagamento, numero_recibo, residente:residentes(nome_completo)')
      .order('competencia', { ascending: false })
      .limit(60),
  ]);
  const lista = (data ?? []) as unknown as Mensalidade[];
  const ehResponsavel = familiares.some((f) => f.responsavel_financeiro);
  const hoje = hojeISO();
  const aberto = lista.filter((m) => m.status === 'PENDENTE').reduce((t, m) => t + Number(m.valor), 0);
  const atraso = lista.filter((m) => m.status === 'PENDENTE' && m.data_vencimento < hoje).length;

  return (
    <>
      <PageHeader titulo="Financeiro" descricao="Mensalidades e situação dos pagamentos dos residentes pelos quais você é o responsável financeiro." />
      <Alert tipo="info" titulo="Como funciona o pagamento">
        O Ginkle mostra os valores e a situação de cada mensalidade. O pagamento é combinado diretamente com a casa de repouso, que registra a baixa no sistema.
      </Alert>

      {!ehResponsavel ? (
        <div className="mt-6">
          <EmptyState
            icone={<Wallet className="size-10" />}
            titulo="Você não é o responsável financeiro de nenhum residente"
            descricao="Os dados financeiros ficam restritos ao responsável financeiro indicado pela casa de repouso. Se for o seu caso, peça ao gestor para ajustar o vínculo."
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Stat rotulo="Em aberto" valor={formatarMoeda(aberto)} />
            <Stat rotulo="Mensalidades em atraso" valor={atraso} />
          </div>
          <Card className="mt-6 !p-0">
            {lista.length === 0 ? (
              <p className="p-6 text-muted">A casa de repouso ainda não lançou mensalidades.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left">
                  <caption className="sr-only">Mensalidades</caption>
                  <thead className="border-b border-line text-sm text-muted">
                    <tr><th scope="col" className="p-4">Competência</th><th scope="col" className="p-4">Residente</th><th scope="col" className="p-4">Valor</th><th scope="col" className="p-4">Vencimento</th><th scope="col" className="p-4">Situação</th><th scope="col" className="p-4">Recibo</th></tr>
                  </thead>
                  <tbody>
                    {lista.map((m) => {
                      const st = statusMensalidade(m, hoje);
                      return (
                        <tr key={m.id} className="border-b border-line last:border-0">
                          <td className="p-4 capitalize">{formatarCompetencia(m.competencia)}</td>
                          <td className="p-4">{m.residente?.nome_completo}</td>
                          <td className="p-4 font-semibold">{formatarMoeda(Number(m.valor))}</td>
                          <td className="p-4">{formatarData(m.data_vencimento)}</td>
                          <td className="p-4"><Badge tom={st.tom}>{st.rotulo}</Badge>{m.data_pagamento && <span className="ml-2 text-sm text-muted">em {formatarData(m.data_pagamento)}</span>}</td>
                          <td className="p-4">{m.numero_recibo ? <a href={`/relatorios/recibo/${m.id}`} className="font-semibold text-accent underline-offset-4 hover:underline">Baixar nº {String(m.numero_recibo).padStart(6, '0')}</a> : <span className="text-muted">-</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}
