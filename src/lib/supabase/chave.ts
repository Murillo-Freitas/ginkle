/**
 * Chave pública do Supabase. Aceita a chave nova (sb_publishable_...) ou a antiga (anon).
 * Preferência para NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; se não existir, usa NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export const CHAVE_PUBLICA: string =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
