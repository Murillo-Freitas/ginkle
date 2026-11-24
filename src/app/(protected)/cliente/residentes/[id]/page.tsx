import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ClipboardX } from 'lucide-react';
import { FiltrosRegistros } from '@/components/features/filtros-registros';
import { chipsVitais, RegistrosLista } from '@/components/features/registro-item';
import { ResidenteCabecalho } from '@/components/features/residente-cabecalho';
import { Download } from 'lucide-react';
import { indicadoresDoDia } from '@/lib/indicadores';
import { classesBotao } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/feedback';
import { Paginacao } from '@/components/ui/pagination';
import { exigirSessao } from '@/lib/auth';
import { carregarResidente } from '@/lib/dados';
import { buscarRegistros, paginaDe, primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { formatarDataHora } from '@/utils/formatters';
import { ehUUID } from '@/utils/validators';

export const metadata: Metadata = { title: 'Linha do tempo' };

export default async function ResidenteFamiliar({ params, searchParams }: {
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

  const [{ itens, total }, vitais, ind] = await Promise.all([
    buscarRegistros(supabase, { residenteId: id, periodo, tipo: tipo || undefined, pagina }),
    buscarRegistros(supabase, { residenteId: id, tipo: 'SINAIS_VITAIS', limite: 3 }),
    indicadoresDoDia(supabase, [id]),
  ]);
  const params2: Record<string, string> = { periodo };
  if (tipo) params2.tipo = tipo;
  const caminho = `/cliente/residentes/${id}`;

  return (
    <>
      <p className="mb-3 text-sm"><Link href="/cliente/residentes" className="font-semibold text-accent underline-offset-4 hover:underline">← Meus familiares</Link></p>
      <ResidenteCabecalho r={residente} casa={residente.ilpi} indicador={ind[id]} acoes={<a href={`/relatorios/residente/${id}?periodo=${periodo}`} className={classesBotao('contorno', 'md')}><Download aria-hidden className="size-4" /> Baixar relatório (PDF)</a>} />

      {vitais.itens.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-lg font-bold">Últimos sinais vitais</h2>
          <ul className="mt-3 space-y-3">
            {vitais.itens.map((v) => (
              <li key={v.id}>
                <p className="text-sm text-muted">{formatarDataHora(v.criado_em_dispositivo)}</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {chipsVitais(v.dados).map((c) => <li key={c} className="rounded-md bg-surface-alt px-2 py-1 text-sm font-medium">{c}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <h2 className="mb-3 mt-8 text-2xl font-bold">Linha do tempo</h2>
      <FiltrosRegistros caminho={caminho} valores={{ periodo, tipo, residente: '', autor: '' }} />
      {itens.length === 0 ? (
        <EmptyState icone={<ClipboardX className="size-10" />} titulo="Nenhum registro neste filtro" descricao="Tente ampliar o período ou escolher todos os tipos." />
      ) : (
        <RegistrosLista itens={itens} />
      )}
      <Paginacao pagina={pagina} total={total} porPagina={10} caminho={caminho} params={params2} />
    </>
  );
}
