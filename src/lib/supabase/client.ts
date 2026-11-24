import { createBrowserClient } from '@supabase/ssr';
import { CHAVE_PUBLICA } from './chave';

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, CHAVE_PUBLICA);
}
