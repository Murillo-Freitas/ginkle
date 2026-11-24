'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';

/** Envia um link de troca de senha para o e-mail da conta atualmente autenticada. */
export function SolicitarAlteracaoSenha() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (espera <= 0) return;
    const timer = window.setTimeout(() => setEspera((valor) => valor - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [espera]);

  async function enviarLink() {
    if (enviando || espera > 0) return;
    setErro('');
    setEnviado(false);
    setEnviando(true);

    try {
      const supabase = createClient();
      const { data, error: erroUsuario } = await supabase.auth.getUser();
      if (erroUsuario) throw erroUsuario;

      const emailAtual = data.user?.email?.trim();
      if (!emailAtual) {
        setErro('Não foi possível identificar o e-mail da sua sessão. Entre novamente na sua conta e tente outra vez.');
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(emailAtual, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/redefinir-senha`,
      });

      if (error) {
        if (error.status === 429) {
          setEspera(60);
          setErro('Você solicitou um link há pouco. Aguarde um minuto antes de tentar novamente.');
          return;
        }
        console.error('[auth] Falha ao solicitar troca de senha pelo perfil:', error);
        setErro('Não foi possível enviar o link agora. Confira sua conexão e tente novamente.');
        return;
      }

      setEmail(emailAtual);
      setEnviado(true);
      setEspera(60);
    } catch (falha) {
      console.error('[auth] Erro ao solicitar troca de senha pelo perfil:', falha);
      setErro('Não foi possível solicitar a troca de senha. Confira sua conexão e tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Enviaremos um link para o e-mail vinculado à sua conta. Sua senha atual continuará válida até você cadastrar uma nova senha pelo link.
      </p>

      {enviado && (
        <Alert tipo="sucesso" titulo="Link enviado">
          Enviamos as instruções para <strong>{email}</strong>. Abra o link no e-mail para cadastrar sua nova senha. Confira também a caixa de spam.
        </Alert>
      )}

      {erro && <Alert tipo="erro">{erro}</Alert>}

      <Button
        variante="contorno"
        tamanho="md"
        className="w-full"
        onClick={enviarLink}
        carregando={enviando}
        disabled={espera > 0}
      >
        {enviando
          ? 'Enviando link…'
          : espera > 0
            ? `Enviar novamente em ${espera}s`
            : enviado
              ? 'Enviar outro link'
              : 'Alterar senha por e-mail'}
      </Button>
    </div>
  );
}
