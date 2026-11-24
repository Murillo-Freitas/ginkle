import { NextResponse, type NextRequest } from 'next/server';
import { criarAdmin } from '@/lib/admin';
import { getSessao } from '@/lib/auth';

interface CorpoInscricao {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
  userAgent?: string;
}

function endpointValido(valor: unknown): valor is string {
  if (typeof valor !== 'string' || valor.length > 4096) return false;
  try {
    const url = new URL(valor);
    if (url.protocol !== 'https:') return false;
    const hostsPermitidos = [
      'fcm.googleapis.com',
      'updates.push.services.mozilla.com',
      'push.services.mozilla.com',
      'web.push.apple.com',
      'notify.windows.com',
    ];
    return hostsPermitidos.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: 'Sua sessão expirou. Entre novamente.' }, { status: 401 });
  const admin = criarAdmin();
  if (!admin) return NextResponse.json({ erro: 'Serviço de notificações não configurado.' }, { status: 503 });

  const corpo = await request.json().catch(() => null) as CorpoInscricao | null;
  const p256dh = corpo?.keys?.p256dh;
  const auth = corpo?.keys?.auth;
  if (!endpointValido(corpo?.endpoint) || typeof p256dh !== 'string' || p256dh.length < 20 || p256dh.length > 256 ||
      typeof auth !== 'string' || auth.length < 10 || auth.length > 256) {
    return NextResponse.json({ erro: 'Inscrição de notificações inválida.' }, { status: 400 });
  }

  const { error } = await admin.from('push_subscriptions').upsert({
    usuario_id: sessao.id,
    endpoint: corpo.endpoint,
    p256dh,
    auth,
    user_agent: typeof corpo.userAgent === 'string' ? corpo.userAgent.slice(0, 200) : null,
  }, { onConflict: 'endpoint' });
  if (error) {
    console.error('[push] Não foi possível salvar a inscrição:', error);
    return NextResponse.json({ erro: 'Não foi possível salvar a inscrição no banco de dados.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const sessao = await getSessao();
  if (!sessao) return NextResponse.json({ erro: 'Sua sessão expirou. Entre novamente.' }, { status: 401 });
  const admin = criarAdmin();
  if (!admin) return NextResponse.json({ erro: 'Serviço de notificações não configurado.' }, { status: 503 });

  const corpo = await request.json().catch(() => null) as { endpoint?: string } | null;
  if (!endpointValido(corpo?.endpoint)) return NextResponse.json({ erro: 'Inscrição inválida.' }, { status: 400 });
  const { error } = await admin.from('push_subscriptions').delete().eq('endpoint', corpo.endpoint).eq('usuario_id', sessao.id);
  if (error) {
    console.error('[push] Não foi possível remover a inscrição:', error);
    return NextResponse.json({ erro: 'Não foi possível remover a inscrição do banco.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
