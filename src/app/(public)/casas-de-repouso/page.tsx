import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSessao } from '@/lib/auth';
import { buscarCasas } from '@/lib/casas';
import { paginaDe, primeiro } from '@/lib/registros';
import { BotaoLocalizacao } from '@/components/features/botao-localizacao';
import { CasaCard } from '@/components/features/casa-card';
import { classesBotao } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/feedback';
import { estiloCampo, estiloRotulo } from '@/components/ui/estilos';
import { Paginacao } from '@/components/ui/pagination';
import { UFS } from '@/utils/constants';

export const metadata: Metadata = {
  title: 'Casas de repouso',
  description: 'Encontre casas de repouso por cidade, estado ou CEP e veja avaliações de outras famílias.',
};

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function DiretorioPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = primeiro(sp.q);
  const uf = primeiro(sp.uf);
  const cidade = primeiro(sp.cidade);
  const cep = primeiro(sp.cep);
  const pagina = paginaDe(sp.pagina);
  const lat = Number(primeiro(sp.lat));
  const lng = Number(primeiro(sp.lng));
  const proximo = primeiro(sp.lat) && primeiro(sp.lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : undefined;

  const supabase = await createClient();
  const sessao = await getSessao();
  const [{ casas, total, notas, distancias }, meuEndereco] = await Promise.all([
    buscarCasas(supabase, { q, uf, cidade, cep, pagina, proximo }),
    sessao
      ? supabase.from('usuarios').select('cidade, uf').eq('id', sessao.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const end = meuEndereco.data as { cidade: string | null; uf: string | null } | null;
  const params: Record<string, string> = {};
  if (q) params.q = q;
  if (uf) params.uf = uf;
  if (cidade) params.cidade = cidade;
  if (cep) params.cep = cep;
  const filtrando = Object.keys(params).length > 0;
  const paramsBusca = { ...params };
  if (proximo) { params.lat = lat.toFixed(4); params.lng = lng.toFixed(4); }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader titulo="Casas de repouso" descricao="Busque por nome, cidade, estado ou CEP. Compare endereços, contatos e avaliações de outras famílias." />

      <form method="get" className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_0.8fr_1fr]">
          <div>
            <label htmlFor="q" className={estiloRotulo}>Nome ou bairro</label>
            <input id="q" name="q" defaultValue={q} placeholder="Ex.: Recanto, Boqueirão" className={estiloCampo} />
          </div>
          <div>
            <label htmlFor="cidade" className={estiloRotulo}>Cidade</label>
            <input id="cidade" name="cidade" defaultValue={cidade} placeholder="Ex.: Praia Grande" className={estiloCampo} />
          </div>
          <div>
            <label htmlFor="uf" className={estiloRotulo}>Estado</label>
            <select id="uf" name="uf" defaultValue={uf} className={estiloCampo}>
              <option value="">Todos</option>
              {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cep" className={estiloRotulo}>Perto do CEP</label>
            <input id="cep" name="cep" defaultValue={cep} inputMode="numeric" placeholder="00000-000" className={estiloCampo} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="submit" className={classesBotao('primario', 'md')}>Buscar</button>
          <BotaoLocalizacao params={paramsBusca} />
          {(filtrando || proximo) && <Link href="/casas-de-repouso" className={classesBotao('contorno', 'md')}>Limpar filtros</Link>}
          {end?.cidade && end.uf && (
            <Link
              href={`/casas-de-repouso?cidade=${encodeURIComponent(end.cidade)}&uf=${end.uf}`}
              className={classesBotao('secundario', 'md')}
            >
              Perto de mim ({end.cidade}/{end.uf})
            </Link>
          )}
        </div>
        <p className="mt-3 text-sm text-muted">A busca por CEP considera os 5 primeiros dígitos (mesma região).</p>
      </form>

      <p className="mt-6 text-muted" aria-live="polite">
        {proximo ? 'Ordenadas pela distância até você. ' : ''}{total === 0 ? 'Nenhuma casa de repouso encontrada.' : `${total} ${total === 1 ? 'casa de repouso encontrada' : 'casas de repouso encontradas'}`}
      </p>

      {casas.length > 0 ? (
        <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {casas.map((c) => <CasaCard key={c.id} casa={c} nota={notas[c.id]} distanciaKm={distancias[c.id]} />)}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState
            icone={<SearchX className="size-10" />}
            titulo="Nada por aqui ainda"
            descricao={filtrando ? 'Tente remover algum filtro ou buscar por outra cidade.' : 'Ainda não há casas de repouso publicadas.'}
            acao={filtrando ? <Link href="/casas-de-repouso" className={classesBotao('contorno', 'md')}>Limpar filtros</Link> : undefined}
          />
        </div>
      )}

      <Paginacao pagina={pagina} total={total} porPagina={12} caminho="/casas-de-repouso" params={params} />
    </div>
  );
}
