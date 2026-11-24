import { createClient } from '@supabase/supabase-js';

/**
 * Cliente com a chave secreta (sb_secret_..., ou a antiga service_role). Ignora as regras de segurança do banco.
 * Use SOMENTE no servidor (rotas /api) e nunca envie esta chave ao navegador.
 * Retorna null quando a chave não está configurada.
 */
export function criarAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null;
  return createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}
