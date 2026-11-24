import type { SupabaseClient } from '@supabase/supabase-js';
import { inicioDoPeriodo } from './registros';

export const ENTIDADES: Record<string, string> = {
  ilpis: 'Casa de repouso',
  vinculos_ilpi: 'Equipe',
  residentes: 'Residente',
  familiares_residentes: 'Familiar vinculado',
  registros_assistenciais: 'Registro de cuidado',
  assinaturas: 'Assinatura',
  mensalidades: 'Mensalidade',
  adesoes_ilpi: 'Solicitação',
  escalas: 'Escala',
};

export const ACOES: Record<string, string> = { INSERT: 'Criou', UPDATE: 'Alterou', DELETE: 'Removeu' };

export interface LinhaLog {
  id: string;
  usuario_nome: string | null;
  acao: string;
  entidade: string;
  resumo: string | null;
  sincronizado_em_servidor: string;
}

export async function consultarLogs(
  supabase: SupabaseClient,
  f: { ilpiId: string; entidade?: string; acao?: string; periodo?: string; pagina?: number; limite?: number },
): Promise<{ itens: LinhaLog[]; total: number }> {
  const limite = f.limite ?? 15;
  const pagina = Math.max(1, f.pagina ?? 1);
  let q = supabase
    .from('logs_acao')
    .select('id, usuario_nome, acao, entidade, resumo, sincronizado_em_servidor', { count: 'exact' })
    .eq('ilpi_id', f.ilpiId);
  if (f.entidade && ENTIDADES[f.entidade]) q = q.eq('entidade', f.entidade);
  if (f.acao && ACOES[f.acao]) q = q.eq('acao', f.acao);
  const desde = f.periodo ? inicioDoPeriodo(f.periodo) : null;
  if (desde) q = q.gte('sincronizado_em_servidor', desde);
  const { data, count } = await q
    .order('sincronizado_em_servidor', { ascending: false })
    .range((pagina - 1) * limite, pagina * limite - 1);
  return { itens: (data ?? []) as unknown as LinhaLog[], total: count ?? 0 };
}
