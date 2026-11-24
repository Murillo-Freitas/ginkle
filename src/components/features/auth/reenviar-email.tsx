'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';

export function ReenviarEmail({ email }: { email: string }) {
  const [espera, setEspera] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((e) => e - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  async function reenviar() {
    if (!email) { setMsg({ tipo: 'erro', texto: 'Informe o e-mail para reenviar a confirmação.' }); return; }
    setEnviando(true);
    setMsg(null);
    const { error } = await createClient().auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/cliente/dashboard` },
    });
    setEnviando(false);
    if (error) {
      setMsg({ tipo: 'erro', texto: error.status === 429 ? 'Aguarde um pouco antes de pedir outro e-mail.' : 'Não foi possível reenviar agora. Tente novamente em instantes.' });
      setEspera(60);
      return;
    }
    setMsg({ tipo: 'sucesso', texto: 'Enviamos um novo e-mail de confirmação. Verifique também a caixa de spam.' });
    setEspera(60);
  }

  return (
    <div className="space-y-3">
      <Button variante="contorno" onClick={reenviar} carregando={enviando} disabled={espera > 0} className="w-full">
        {espera > 0 ? `Reenviar e-mail (${espera}s)` : 'Reenviar e-mail de confirmação'}
      </Button>
      {msg && <Alert tipo={msg.tipo}>{msg.texto}</Alert>}
    </div>
  );
}
