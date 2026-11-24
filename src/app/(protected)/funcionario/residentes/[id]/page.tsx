import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiltrosRegistros } from '@/components/features/filtros-registros';
import { RegistrosLista } from '@/components/features/registro-item';
import { ResidenteCabecalho } from '@/components/features/residente-cabecalho';
import { Download } from 'lucide-react';
import { indicadoresDoDia } from '@/lib/indicadores';
import { classesBotao, LinkButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { Paginacao } from '@/components/ui/pagination';
import { exigirSessao } from '@/lib/auth';
import { carregarResidente } from '@/lib/dados';
import { buscarRegistros, paginaDe, primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { ehUUID } from '@/utils/validators';

export const metadata: Metadata = { title: 'Residente' };

export default async function ResidenteEquipe({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigirSessao();
  const { id } = await params;
  if (!ehUUID(id)) notFound();
  const sp = await searchParams;
  const periodo = primeiro(sp.periodo) || '30d';
  const tipo = primeiro(sp.tipo);
  const pagina = paginaDe(sp.pagina);

  const supabase = await createClient();
  const residente = await carregarResidente(supabase, id);
  if (!residente) notFound();
  const [{ itens, total }, ind] = await Promise.all([
    buscarRegistros(supabase, { residenteId: id, periodo, tipo: tipo || undefined, pagina }),
    indicadoresDoDia(supabase, [id]),
  ]);
  const caminho = `/funcionario/residentes/${id}`;
  const params2: Record<string, string> = { periodo };
  if (tipo) params2.tipo = tipo;

  return (
    <>
      <p className="mb-3 text-sm"><Link href="/funcionario/residentes" className="font-semibold text-accent underline-offset-4 hover:underline">← Residentes</Link></p>
      <ResidenteCabecalho r={residente} casa={residente.ilpi} indicador={ind[id]} acoes={<a href={`/relatorios/residente/${id}?periodo=${periodo}`} className={classesBotao('contorno', 'md')}><Download aria-hidden className="size-4" /> Baixar relatório (PDF)</a>} />
      <div className="mt-5 flex flex-wrap gap-2">
        <LinkButton href={`/funcionario/registros/novo?residente=${id}`}>Novo registro</LinkButton>
        <LinkButton href={`/funcionario/registros/novo?residente=${id}&tipo=SINAIS_VITAIS`} variante="contorno">Sinais vitais</LinkButton>
        <LinkButton href={`/funcionario/registros/novo?residente=${id}&tipo=MEDICACAO`} variante="contorno">Medicação</LinkButton>
      </div>
      <h2 className="mb-3 mt-8 text-2xl font-bold">Histórico do residente</h2>
      <FiltrosRegistros caminho={caminho} valores={{ periodo, tipo, residente: '', autor: '' }} />
      {itens.length === 0 ? <EmptyState titulo="Nenhum registro neste filtro" /> : <RegistrosLista itens={itens} />}
      <Paginacao pagina={pagina} total={total} porPagina={10} caminho={caminho} params={params2} />
    </>
  );
}
