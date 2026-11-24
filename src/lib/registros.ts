import type { SupabaseClient } from '@supabase/supabase-js';
import { FUSO, POR_PAGINA } from '@/utils/constants';
import type { Registro } from '@/types';

export interface FiltroRegistros {
  ilpiId?: string;
  residenteId?: string;
  tipo?: string;
  periodo?: string;
  pagina?: number;
  autorId?: string;
  apenasUrgentes?: boolean;
  limite?: number;
}

const COLUNAS =
  'id, residente_id, tipo, categoria, titulo, descricao, urgente, medicamento, dose, lote, situacao, dados, humor, estado_geral, assinado, autor_nome, autor_cargo, criado_em_dispositivo, residente:residentes(nome_completo)';

export function inicioDoPeriodo(periodo: string): string | null {
  const agora = new Date();
  if (periodo === '7d') return new Date(agora.getTime() - 7 * 86_400_000).toISOString();
  if (periodo === '30d') return new Date(agora.getTime() - 30 * 86_400_000).toISOString();
  if (periodo === 'mes') {
    const [a, m] = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit' }).format(agora).split('-');
    return new Date(`${a}-${m}-01T00:00:00-03:00`).toISOString();
  }
  return null;
}

export function inicioDeHoje(): string {
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: FUSO });
  return new Date(`${hoje}T00:00:00-03:00`).toISOString();
}

export async function buscarRegistros(supabase: SupabaseClient, f: FiltroRegistros): Promise<{ itens: Registro[]; total: number }> {
  const porPagina = f.limite ?? POR_PAGINA;
  const pagina = Math.max(1, f.pagina ?? 1);
  let q = supabase.from('registros_assistenciais').select(COLUNAS, { count: 'exact' });

  if (f.ilpiId) q = q.eq('ilpi_id', f.ilpiId);
  if (f.residenteId) q = q.eq('residente_id', f.residenteId);
  if (f.tipo) q = q.eq('tipo', f.tipo);
  if (f.autorId) q = q.eq('autor_id', f.autorId);
  if (f.apenasUrgentes) q = q.eq('urgente', true);
  const desde = f.periodo ? (f.periodo === 'hoje' ? inicioDeHoje() : inicioDoPeriodo(f.periodo)) : null;
  if (desde) q = q.gte('criado_em_dispositivo', desde);

  const { data, count } = await q
    .order('criado_em_dispositivo', { ascending: false })
    .range((pagina - 1) * porPagina, pagina * porPagina - 1);

  return { itens: (data ?? []) as unknown as Registro[], total: count ?? 0 };
}

/** Converte o valor de searchParams (string | string[] | undefined) em string simples. */
export function primeiro(valor: string | string[] | undefined): string {
  return Array.isArray(valor) ? (valor[0] ?? '') : (valor ?? '');
}

export function paginaDe(valor: string | string[] | undefined): number {
  const n = parseInt(primeiro(valor), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
