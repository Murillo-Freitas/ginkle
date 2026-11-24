'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { Alert } from '@/components/ui/feedback';
import { validarEmail } from '@/utils/validators';

export function EsqueciSenhaForm() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((e) => e - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setErro('');
    if (!validarEmail(email)) { setErro('Informe um e-mail válido.'); return; }
    setEnviando(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/confirm?next=/redefinir-senha`,
      });
      if (error?.status === 429) {
        setErro('Você já pediu um e-mail há pouco. Aguarde alguns minutos para pedir outro.');
        setEspera(60);
        return;
      }
      if (error) {
        console.error('[auth] Falha ao solicitar recuperação de senha:', error);
        setErro('Não foi possível solicitar o link agora. Confira sua conexão e tente novamente.');
        return;
      }
      // Resposta neutra: não revela se o e-mail tem conta (evita descobrir cadastros).
      setEnviado(true);
      setEspera(60);
    } catch (falha) {
      console.error('[auth] Erro de rede ao solicitar recuperação de senha:', falha);
      setErro('Não foi possível solicitar o link agora. Confira sua conexão e tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="space-y-5">
        <Alert tipo="sucesso" titulo="Verifique o seu e-mail">
          Se existir uma conta com <strong>{email.trim()}</strong>, enviamos um link para criar uma nova senha. O link vale por tempo limitado. Confira também a caixa de spam.
        </Alert>
        <Button variante="contorno" className="w-full" disabled={espera > 0} onClick={() => setEnviado(false)}>
          {espera > 0 ? `Enviar para outro e-mail (${espera}s)` : 'Enviar novamente'}
        </Button>
        <p className="text-center"><Link href="/login" className="font-semibold text-accent underline-offset-4 hover:underline">Voltar para o login</Link></p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <Input rotulo="E-mail da sua conta" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      {erro && <Alert tipo="erro">{erro}</Alert>}
      <Button type="submit" tamanho="lg" carregando={enviando} disabled={espera > 0} className="w-full">
        {espera > 0 ? `Aguarde ${espera}s` : 'Enviar link de recuperação'}
      </Button>
      <p className="text-center"><Link href="/login" className="font-semibold text-accent underline-offset-4 hover:underline">Voltar para o login</Link></p>
    </form>
  );
}
