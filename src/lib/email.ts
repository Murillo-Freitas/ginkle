/** Envio de e-mails transacionais pela API do SendGrid. Retorna false se não estiver configurado ou se o envio falhar. */
export async function enviarEmail(o: { para: string; assunto: string; html: string; texto: string }): Promise<boolean> {
  const chave = process.env.SENDGRID_API_KEY;
  const remetenteEmail = process.env.SENDGRID_FROM_EMAIL;
  const remetenteNome = process.env.SENDGRID_FROM_NAME ?? 'Ginkle';

  if (!chave || !remetenteEmail) {
    console.error('[email] SENDGRID_API_KEY ou SENDGRID_FROM_EMAIL não configurado.');
    return false;
  }

  try {
    const resposta = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chave}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: o.para }] }],
        from: { email: remetenteEmail, name: remetenteNome },
        subject: o.assunto,
        content: [
          { type: 'text/plain', value: o.texto },
          { type: 'text/html', value: o.html },
        ],
      }),
      cache: 'no-store',
    });

    if (!resposta.ok) {
      // O corpo de erro ajuda a identificar remetente não verificado ou permissão insuficiente.
      // Nunca registrar a chave de API.
      const detalhe = (await resposta.text()).slice(0, 1200);
      console.error(`[email] SendGrid respondeu HTTP ${resposta.status}: ${detalhe}`);
      return false;
    }

    // A Mail Send API normalmente responde com HTTP 202 (Accepted).
    return true;
  } catch (erro) {
    console.error('[email] Não foi possível conectar à API do SendGrid:', erro);
    return false;
  }
}

export const escaparHtml = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
