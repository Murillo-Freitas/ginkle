import type { SupabaseClient } from '@supabase/supabase-js';
import { inicioDeHoje } from './registros';

export type Nivel = 'BEM' | 'ATENCAO' | 'ALERTA';
export interface IndicadorDia { humor: Nivel | null; estado: Nivel | null }

/** Resume o dia de cada residente: humor e estado geral mais recentes; ocorrência urgente força "alerta". */
export async function indicadoresDoDia(supabase: SupabaseClient, ids: string[]): Promise<Record<string, IndicadorDia>> {
  const saida: Record<string, IndicadorDia> = {};
  for (const id of ids) saida[id] = { humor: null, estado: null };
  if (ids.length === 0) return saida;

  const { data } = await supabase
    .from('registros_assistenciais')
    .select('residente_id, humor, estado_geral, urgente, criado_em_dispositivo')
    .in('residente_id', ids)
    .gte('criado_em_dispositivo', inicioDeHoje())
    .order('criado_em_dispositivo', { ascending: false })
    .limit(500);

  for (const r of (data ?? []) as { residente_id: string; humor: Nivel | null; estado_geral: Nivel | null; urgente: boolean }[]) {
    const i = saida[r.residente_id];
    if (!i) continue;
    if (!i.humor && r.humor) i.humor = r.humor;
    if (!i.estado && r.estado_geral) i.estado = r.estado_geral;
    if (r.urgente) i.estado = 'ALERTA';
  }
  return saida;
}
