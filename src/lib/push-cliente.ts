/** Pede ao servidor para notificar os participantes corretos. A autorização é validada na API. */
export function notificarPush(tipo: 'mensagem' | 'registro' | 'solicitacao_nova' | 'solicitacao_resposta', id: string) {
  void fetch('/api/push/notificar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ tipo, id }),
    keepalive: true,
  }).then(async (resposta) => {
    if (!resposta.ok) console.warn('[push] O servidor não aceitou a notificação:', resposta.status);
  }).catch((erro: unknown) => console.warn('[push] Não foi possível solicitar o envio:', erro));
}
