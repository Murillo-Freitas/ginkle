import type { Metadata } from 'next';
import { ClipboardX } from 'lucide-react';
import { FiltrosRegistros } from '@/components/features/filtros-registros';
import { RegistrosLista } from '@/components/features/registro-item';
import { SemCasaEquipe } from '@/components/features/sem-casa';
import { PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/feedback';
import { Paginacao } from '@/components/ui/pagination';
import { exigirSessao, getCasaEquipe } from '@/lib/auth';
import { listarResidentesCasa } from '@/lib/dados';
import { buscarRegistros, paginaDe, primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Histórico de registros' };

export default async function HistoricoEquipe({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sessao = await exigirSessao();
  const vinculo = await getCasaEquipe();
  if (!vinculo) return <><PageHeader titulo="Histórico de registros" /><SemCasaEquipe /></>;

  const sp = await searchParams;
  const periodo = primeiro(sp.periodo) || '30d';
  const tipo = primeiro(sp.tipo);
  const residente = primeiro(sp.residente);
  const autor = primeiro(sp.autor);
  const pagina = paginaDe(sp.pagina);
  const supabase = await createClient();

  const [residentes, { itens, total }] = await Promise.all([
    listarResidentesCasa(supabase, vinculo.casa.id),
    buscarRegistros(supabase, {
      ilpiId: vinculo.casa.id, periodo, tipo: tipo || undefined, residenteId: residente || undefined,
      autorId: autor === 'eu' ? sessao.id : undefined, pagina,
    }),
  ]);
  const params: Record<string, string> = { periodo };
  if (tipo) params.tipo = tipo;
  if (residente) params.residente = residente;
  if (autor) params.autor = autor;

  return (
    <>
      <PageHeader titulo="Histórico de registros" descricao="Todos os registros da casa de repouso, com filtros por período, tipo, residente e autoria." />
      <FiltrosRegistros caminho="/funcionario/historico" mostrarAutor valores={{ periodo, tipo, residente, autor }}
        residentes={residentes.map((r) => ({ id: r.id, nome: r.nome_completo }))} />
      {itens.length === 0 ? <EmptyState icone={<ClipboardX className="size-10" />} titulo="Nenhum registro encontrado" descricao="Altere os filtros para ver outros registros." /> : <RegistrosLista itens={itens} mostrarResidente />}
      <Paginacao pagina={pagina} total={total} porPagina={10} caminho="/funcionario/historico" params={params} />
    </>
  );
}
