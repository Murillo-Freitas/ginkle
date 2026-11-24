import type { SupabaseClient } from '@supabase/supabase-js';
import type { Residente } from '@/types';

export interface FamiliarVinculo {
  id: string;
  parentesco: string;
  responsavel_principal: boolean;
  responsavel_financeiro: boolean;
  residente: Residente & { ilpi: { id: string; nome_fantasia: string; cidade: string; uf: string } | null };
}

const COLUNAS_RESIDENTE =
  'id, ilpi_id, nome_completo, sexo, data_nascimento, quarto, tipo_sanguineo, alergias, observacoes_medicas, data_ingresso, status';

export async function listarFamiliares(supabase: SupabaseClient, userId: string): Promise<FamiliarVinculo[]> {
  const { data } = await supabase
    .from('familiares_residentes')
    .select(`id, parentesco, responsavel_principal, responsavel_financeiro, residente:residentes(${COLUNAS_RESIDENTE}, ilpi:ilpis(id, nome_fantasia, cidade, uf))`)
    .eq('usuario_id', userId);
  return ((data ?? []) as unknown as FamiliarVinculo[]).filter((f) => f.residente);
}

export async function listarResidentesCasa(
  supabase: SupabaseClient, ilpiId: string, opts: { q?: string; status?: string } = {},
): Promise<Residente[]> {
  let q = supabase.from('residentes').select(COLUNAS_RESIDENTE).eq('ilpi_id', ilpiId);
  if (opts.status === 'ATIVO' || opts.status === 'INATIVO') q = q.eq('status', opts.status);
  const texto = (opts.q ?? '').replace(/[%,()*\\]/g, ' ').trim();
  if (texto) q = q.or(`nome_completo.ilike.%${texto}%,quarto.ilike.%${texto}%`);
  const { data } = await q.order('nome_completo', { ascending: true }).limit(300);
  return (data ?? []) as unknown as Residente[];
}

export async function carregarResidente(supabase: SupabaseClient, id: string) {
  const { data } = await supabase
    .from('residentes')
    .select(`${COLUNAS_RESIDENTE}, ilpi:ilpis(id, nome_fantasia, cidade, uf)`)
    .eq('id', id)
    .maybeSingle();
  return data as unknown as (Residente & { ilpi: { id: string; nome_fantasia: string; cidade: string; uf: string } | null }) | null;
}

export async function contar(
  supabase: SupabaseClient,
  tabela: string,
  filtros: Record<string, string | boolean>,
  desde?: { coluna: string; valor: string },
  antes?: { coluna: string; valor: string },
): Promise<number> {
  let q = supabase.from(tabela).select('id', { count: 'exact', head: true });
  for (const [k, v] of Object.entries(filtros)) q = q.eq(k, v);
  if (desde) q = q.gte(desde.coluna, desde.valor);
  if (antes) q = q.lt(antes.coluna, antes.valor);
  const { count } = await q;
  return count ?? 0;
}

export function statusMensalidade(m: { status: string; data_vencimento: string }, hoje: string): { rotulo: string; tom: 'ok' | 'aviso' | 'perigo' | 'neutro' } {
  if (m.status === 'PAGA') return { rotulo: 'Paga', tom: 'ok' };
  if (m.status === 'CANCELADA') return { rotulo: 'Cancelada', tom: 'neutro' };
  if (m.data_vencimento < hoje) return { rotulo: 'Em atraso', tom: 'perigo' };
  return { rotulo: 'A vencer', tom: 'aviso' };
}
