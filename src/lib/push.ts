import webpush from 'web-push';
import { criarAdmin } from './admin';

let configurado = false;
function configurar(): boolean {
  if (configurado) return true;
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privada = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publica || !privada) {
    console.error('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY não configurada.');
    return false;
  }
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT?.trim() || 'mailto:contato@ginkle.example', publica, privada);
    configurado = true;
    return true;
  } catch (erro) {
    console.error('[push] As chaves VAPID ou VAPID_SUBJECT são inválidas:', erro);
    return false;
  }
}

export interface CargaPush { titulo: string; corpo: string; url: string }

/** Envia a notificação aos aparelhos inscritos, respeitando as preferências de cada pessoa. */
export async function enviarPush(usuarioIds: string[], carga: CargaPush, preferencia: 'push_chat' | 'push_urgente' | 'push_solicitacoes'): Promise<number> {
  const admin = criarAdmin();
  if (!admin) {
    console.error('[push] SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY não configurada.');
    return 0;
  }
  if (!configurar() || usuarioIds.length === 0) return 0;

  const { data: prefs, error: erroPrefs } = await admin.from('preferencias_notificacao').select(`usuario_id, ${preferencia}`).in('usuario_id', usuarioIds);
  if (erroPrefs) {
    console.error('[push] Falha ao consultar preferências:', erroPrefs);
    return 0;
  }
  const desligados = new Set(
    ((prefs ?? []) as unknown as Record<string, string | boolean>[]).filter((p) => p[preferencia] === false).map((p) => String(p.usuario_id)),
  );
  const alvos = usuarioIds.filter((id) => !desligados.has(id));
  if (alvos.length === 0) return 0;

  const { data: subs, error: erroSubs } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').in('usuario_id', alvos);
  if (erroSubs) {
    console.error('[push] Falha ao consultar inscrições:', erroSubs);
    return 0;
  }
  const lista = (subs ?? []) as { id: string; endpoint: string; p256dh: string; auth: string }[];
  let enviados = 0;
  await Promise.all(
    lista.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(carga));
        enviados++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await admin.from('push_subscriptions').delete().eq('id', s.id);
        } else {
          console.error(`[push] Falha ao enviar notificação (HTTP ${status ?? 'desconhecido'}):`, e);
        }
      }
    }),
  );
  return enviados;
}
