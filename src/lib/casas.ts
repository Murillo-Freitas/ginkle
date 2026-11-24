import type { SupabaseClient } from '@supabase/supabase-js';
import { distanciaKm } from '@/utils/geo';
import { UFS } from '@/utils/constants';
import type { Casa } from '@/types';

/** Somente colunas liberadas para o público (o banco bloqueia as demais, como CNPJ e razão social). */
export const COLUNAS_CASA =
  'id, nome_fantasia, descricao, telefone, email, site, cep, logradouro, numero, complemento, bairro, cidade, uf, logo_url, capa_url, latitude, longitude, publicada, verificada';

export interface FiltroCasas {
  q?: string;
  uf?: string;
  cidade?: string;
  cep?: string;
  pagina?: number;
  porPagina?: number;
  /** Quando informado, ordena pela distância (casas sem coordenadas vão para o fim). */
  proximo?: { lat: number; lng: number };
}

const limpar = (t: string) => t.replace(/[,()%*\\]/g, ' ').trim();

export async function buscarCasas(supabase: SupabaseClient, f: FiltroCasas) {
  const porPagina = f.porPagina ?? 12;
  const pagina = Math.max(1, f.pagina ?? 1);
  let q = supabase.from('ilpis').select(COLUNAS_CASA, { count: 'exact' }).eq('publicada', true);

  const texto = limpar(f.q ?? '');
  if (texto) q = q.or(`nome_fantasia.ilike.%${texto}%,bairro.ilike.%${texto}%,descricao.ilike.%${texto}%`);
  if (f.uf && (UFS as readonly string[]).includes(f.uf)) q = q.eq('uf', f.uf);
  const cidade = limpar(f.cidade ?? '');
  if (cidade) q = q.ilike('cidade', `%${cidade}%`);
  const cep = (f.cep ?? '').replace(/\D/g, '');
  if (cep.length >= 5) q = q.like('cep', `${cep.slice(0, 5)}%`);

  const ordenada = q.order('verificada', { ascending: false }).order('nome_fantasia', { ascending: true });
  const { data, count } = f.proximo
    ? await ordenada.limit(300)
    : await ordenada.range((pagina - 1) * porPagina, pagina * porPagina - 1);

  let casas = (data ?? []) as unknown as Casa[];
  const distancias: Record<string, number> = {};
  if (f.proximo) {
    for (const c of casas) {
      if (c.latitude != null && c.longitude != null) distancias[c.id] = distanciaKm(f.proximo, { lat: c.latitude, lng: c.longitude });
    }
    casas = [...casas].sort((a, b) => (distancias[a.id] ?? 1e9) - (distancias[b.id] ?? 1e9));
    casas = casas.slice((pagina - 1) * porPagina, pagina * porPagina);
  }

  const ids = casas.map((c) => c.id);
  const notas: Record<string, { nota_media: number; total: number }> = {};
  if (ids.length) {
    const { data: av } = await supabase.from('casas_avaliacao').select('ilpi_id, nota_media, total').in('ilpi_id', ids);
    for (const a of (av ?? []) as { ilpi_id: string; nota_media: number; total: number }[]) {
      notas[a.ilpi_id] = { nota_media: Number(a.nota_media), total: a.total };
    }
  }
  return { casas, total: f.proximo ? Math.min(count ?? 0, 300) : (count ?? 0), notas, distancias };
}
