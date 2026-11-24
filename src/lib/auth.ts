import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { CasaResumo, Perfil, Sessao } from '@/types';

const PERFIS_VALIDOS: Perfil[] = ['CLIENTE', 'FUNCIONARIO', 'GERENTE'];

export function normalizarPerfis(valor: unknown): Perfil[] {
  const lista = Array.isArray(valor) ? valor.filter((p): p is Perfil => PERFIS_VALIDOS.includes(p)) : [];
  return lista.length > 0 ? lista : ['CLIENTE'];
}

/** Sessão da requisição atual (uma única chamada ao Auth por renderização). */
export const getSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const perfis = normalizarPerfis(user.app_metadata?.perfis);
  const jar = await cookies();
  const salvo = jar.get('ginkle_perfil')?.value as Perfil | undefined;
  const perfilAtivo: Perfil = salvo && perfis.includes(salvo) ? salvo : perfis.includes('CLIENTE') ? 'CLIENTE' : perfis[0];
  const nome = (user.user_metadata?.nome_completo as string | undefined) || user.email || 'Usuário';

  return { id: user.id, email: user.email ?? '', nome, perfis, perfilAtivo };
});

export async function exigirSessao(): Promise<Sessao> {
  const sessao = await getSessao();
  if (!sessao) redirect('/login');
  return sessao;
}

export interface Vinculo {
  id: string;
  cargo: string;
  ilpi: CasaResumo;
}

/** Vínculos ativos do usuário com casas de repouso (uma consulta por requisição). */
export const getVinculos = cache(async (): Promise<Vinculo[]> => {
  const sessao = await getSessao();
  if (!sessao) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('vinculos_ilpi')
    .select('id, cargo, ilpi:ilpis(id, nome_fantasia, cidade, uf, publicada, verificada, logo_url, capa_url)')
    .eq('usuario_id', sessao.id)
    .eq('ativo', true);
  return ((data ?? []) as unknown as Vinculo[]).filter((v) => v.ilpi);
});

/** Casas em que o usuário é gestor e a casa selecionada (cookie "ginkle_casa"). */
export async function getCasaGestor(): Promise<{ casa: CasaResumo | null; casas: CasaResumo[] }> {
  const casas = (await getVinculos()).filter((v) => v.cargo === 'GESTOR').map((v) => v.ilpi);
  const jar = await cookies();
  const salva = jar.get('ginkle_casa')?.value;
  const casa = casas.find((c) => c.id === salva) ?? casas[0] ?? null;
  return { casa, casas };
}

export async function exigirCasaGestor(): Promise<{ casa: CasaResumo; casas: CasaResumo[] }> {
  const { casa, casas } = await getCasaGestor();
  if (!casa) redirect('/cadastrar-casa');
  return { casa, casas };
}

/** Casa de trabalho do funcionário (prefere um vínculo que não seja de gestor). */
export async function getCasaEquipe(): Promise<{ casa: CasaResumo; cargo: string } | null> {
  const vs = await getVinculos();
  const v = vs.find((x) => x.cargo !== 'GESTOR') ?? vs[0];
  return v ? { casa: v.ilpi, cargo: v.cargo } : null;
}
