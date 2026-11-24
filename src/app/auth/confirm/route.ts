import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { caminhoSeguro } from '@/utils/validators';

/**
 * Recebe o clique no link do e-mail (confirmação de cadastro ou recuperação de senha).
 *  - Modelo de e-mail recomendado: ?token_hash=...&type=...  (funciona em qualquer aparelho)
 *  - Modelo padrão do Supabase:    ?code=...                  (precisa abrir no mesmo navegador do cadastro)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const tipo = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  // Alguns modelos de e-mail podem não preservar o parâmetro next. Nunca envie um link
  // de recuperação válido para o dashboard: a tela precisa receber a sessão de recovery.
  const destino = tipo === 'recovery'
    ? '/redefinir-senha'
    : caminhoSeguro(searchParams.get('next'), '/cliente/dashboard');

  const supabase = await createClient();
  let falhou = true;

  if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    falhou = Boolean(error);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    falhou = Boolean(error);
  }

  if (falhou) return NextResponse.redirect(new URL('/login?erro=link_invalido', origin));
  return NextResponse.redirect(new URL(destino, origin));
}
