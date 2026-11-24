import type { Metadata } from 'next';
import Link from 'next/link';
import { SemCasaEquipe } from '@/components/features/sem-casa';
import { classesBotao } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { Indicadores } from '@/components/features/semaforo';
import { indicadoresDoDia } from '@/lib/indicadores';
import { estiloCampo, estiloRotulo } from '@/components/ui/estilos';
import { exigirSessao, getCasaEquipe } from '@/lib/auth';
import { listarResidentesCasa } from '@/lib/dados';
import { primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { calcularIdade } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Residentes' };

export default async function ResidentesEquipe({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await exigirSessao();
  const vinculo = await getCasaEquipe();
  if (!vinculo) return <><PageHeader titulo="Residentes" /><SemCasaEquipe /></>;
  const q = primeiro((await searchParams).q);
  const supabase = await createClient();
  const residentes = await listarResidentesCasa(supabase, vinculo.casa.id, { q, status: 'ATIVO' });
  const ind = await indicadoresDoDia(supabase, residentes.map((r) => r.id));

  return (
    <>
      <PageHeader titulo="Residentes" descricao={`${vinculo.casa.nome_fantasia}: residentes ativos.`} />
      <form method="get" className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="q" className={estiloRotulo}>Buscar por nome ou quarto</label>
          <input id="q" name="q" defaultValue={q} className={estiloCampo} />
        </div>
        <button type="submit" className={classesBotao('primario', 'md')}>Buscar</button>
      </form>
      {residentes.length === 0 ? (
        <EmptyState titulo="Nenhum residente encontrado" descricao={q ? 'Tente outro termo de busca.' : 'O gestor ainda não cadastrou residentes nesta casa.'} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {residentes.map((r) => (
            <li key={r.id}>
              <Link href={`/funcionario/residentes/${r.id}`} className="block h-full rounded-xl border border-line bg-surface p-5 shadow-sm hover:shadow-md">
                <p className="text-lg font-semibold">{r.nome_completo}</p>
                <p className="text-sm text-muted">{calcularIdade(r.data_nascimento)} anos{r.quarto ? ` · Quarto ${r.quarto}` : ''}</p>
                <div className="mt-2"><Indicadores indicador={ind[r.id]} /></div>
                {!/^nenhuma/i.test(r.alergias) && <div className="mt-2"><Badge tom="aviso">Alergia: {r.alergias}</Badge></div>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
