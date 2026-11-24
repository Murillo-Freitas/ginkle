import { NextResponse, type NextRequest } from 'next/server';
import { criarAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { validarEmail } from '@/utils/validators';

/**
 * Login com bloqueio temporário: 5 senhas erradas seguidas bloqueiam o e-mail por 15 minutos.
 * Observação: o bloqueio vale para quem entra pelo site. Quem chamar a API do Supabase diretamente
 * continua protegido apenas pelos limites do próprio Supabase (Authentication > Rate Limits).
 */
export async function POST(request: NextRequest) {
  const corpo = (await request.json().catch(() => null)) as { email?: string; senha?: string } | null;
  const email = corpo?.email?.trim().toLowerCase() ?? '';
  const senha = corpo?.senha ?? '';
  if (!validarEmail(email) || !senha) return NextResponse.json({ erro: 'credenciais' }, { status: 400 });

  const admin = criarAdmin();
  if (admin) {
    const { data: ate } = await admin.rpc('login_bloqueado', { p_email: email });
    if (ate) return NextResponse.json({ erro: 'bloqueado', ate }, { status: 429 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error || !data.user) {
    if (error?.message.toLowerCase().includes('email not confirmed')) {
      return NextResponse.json({ erro: 'nao_confirmado' }, { status: 401 });
    }
    if (error?.status === 429) return NextResponse.json({ erro: 'limite' }, { status: 429 });
    if (admin) {
      const { data: ate } = await admin.rpc('registrar_falha_login', { p_email: email });
      if (ate) return NextResponse.json({ erro: 'bloqueado', ate }, { status: 429 });
    }
    return NextResponse.json({ erro: 'credenciais' }, { status: 401 });
  }

  if (admin) await admin.rpc('limpar_falhas_login', { p_email: email });
  return NextResponse.json({ ok: true, perfis: data.user.app_metadata?.perfis ?? ['CLIENTE'] });
}
