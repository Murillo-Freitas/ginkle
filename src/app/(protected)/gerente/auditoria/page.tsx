import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import { classesBotao } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { estiloCampo, estiloRotulo } from '@/components/ui/estilos';
import { Paginacao } from '@/components/ui/pagination';
import { exigirCasaGestor } from '@/lib/auth';
import { ACOES, consultarLogs, ENTIDADES } from '@/lib/auditoria';
import { paginaDe, primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { PERIODOS } from '@/utils/constants';
import { formatarDataHora } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Histórico de ações' };

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { casa } = await exigirCasaGestor();
  const sp = await searchParams;
  const periodo = primeiro(sp.periodo) || '30d';
  const entidade = primeiro(sp.entidade);
  const acao = primeiro(sp.acao);
  const pagina = paginaDe(sp.pagina);

  const { itens, total } = await consultarLogs(await createClient(), { ilpiId: casa.id, periodo, entidade, acao, pagina });
  const params: Record<string, string> = { periodo };
  if (entidade) params.entidade = entidade;
  if (acao) params.acao = acao;
  const exportar = `/gerente/auditoria/exportar?${new URLSearchParams(params).toString()}`;
  const tom = { INSERT: 'ok', UPDATE: 'aviso', DELETE: 'perigo' } as const;

  return (
    <>
      <PageHeader
        titulo="Histórico de ações" descricao="Registro de quem fez o quê, e quando, na casa de repouso. Os registros não podem ser alterados nem apagados."
        acao={<><a href={exportar} className={classesBotao('contorno', 'md')}><Download aria-hidden className="size-4" /> Exportar CSV</a><a href={`${exportar}&formato=pdf`} className={classesBotao('contorno', 'md')}><Download aria-hidden className="size-4" /> Exportar PDF</a></>}
      />
      <form method="get" className="mb-5 rounded-xl border border-line bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label htmlFor="periodo" className={estiloRotulo}>Período</label>
            <select id="periodo" name="periodo" defaultValue={periodo} className={estiloCampo}>{PERIODOS.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}</select></div>
          <div><label htmlFor="entidade" className={estiloRotulo}>O que foi alterado</label>
            <select id="entidade" name="entidade" defaultValue={entidade} className={estiloCampo}><option value="">Tudo</option>{Object.entries(ENTIDADES).map(([v, r]) => <option key={v} value={v}>{r}</option>)}</select></div>
          <div><label htmlFor="acao" className={estiloRotulo}>Ação</label>
            <select id="acao" name="acao" defaultValue={acao} className={estiloCampo}><option value="">Todas</option>{Object.entries(ACOES).map(([v, r]) => <option key={v} value={v}>{r}</option>)}</select></div>
        </div>
        <button type="submit" className={classesBotao('primario', 'md', 'mt-4')}>Aplicar filtros</button>
      </form>

      {itens.length === 0 ? (
        <EmptyState titulo="Nenhuma ação encontrada" descricao="Altere os filtros ou o período." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[42rem] text-left">
            <caption className="sr-only">Histórico de ações</caption>
            <thead className="border-b border-line text-sm text-muted">
              <tr><th scope="col" className="p-4">Data e hora</th><th scope="col" className="p-4">Usuário</th><th scope="col" className="p-4">Ação</th><th scope="col" className="p-4">Detalhe</th></tr>
            </thead>
            <tbody>
              {itens.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="p-4 whitespace-nowrap">{formatarDataHora(l.sincronizado_em_servidor)}</td>
                  <td className="p-4">{l.usuario_nome ?? 'Sistema'}</td>
                  <td className="p-4"><Badge tom={tom[l.acao as keyof typeof tom] ?? 'neutro'}>{ACOES[l.acao] ?? l.acao}</Badge> <span className="ml-1">{ENTIDADES[l.entidade] ?? l.entidade}</span></td>
                  <td className="p-4 text-muted">{l.resumo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Paginacao pagina={pagina} total={total} porPagina={15} caminho="/gerente/auditoria" params={params} />
    </>
  );
}
