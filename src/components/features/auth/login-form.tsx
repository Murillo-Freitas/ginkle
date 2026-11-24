'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { Alert } from '@/components/ui/feedback';
import { normalizarPerfisCliente } from '@/utils/perfis';
import { DASHBOARD_POR_PERFIL } from '@/utils/constants';
import { formatarHora } from '@/utils/formatters';
import { caminhoSeguro, validarEmail } from '@/utils/validators';
import { ReenviarEmail } from './reenviar-email';
import type { Perfil } from '@/types';

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [ver, setVer] = useState(false);
  const [erro, setErro] = useState('');
  const [naoConfirmado, setNaoConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function entrar(ev: FormEvent) {
    ev.preventDefault();
    setErro('');
    setNaoConfirmado(false);
    if (!validarEmail(email) || !senha) { setErro('Informe um e-mail válido e a sua senha.'); return; }

    setEnviando(true);
    let resposta: Response;
    try {
      resposta = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), senha }),
      });
    } catch {
      setEnviando(false);
      setErro('Sem conexão com o servidor. Verifique a internet e tente de novo.');
      return;
    }
    const corpo = (await resposta.json().catch(() => ({}))) as { ok?: boolean; erro?: string; ate?: string; perfis?: unknown };

    if (!resposta.ok || !corpo.ok) {
      setEnviando(false);
      if (corpo.erro === 'nao_confirmado') {
        setNaoConfirmado(true);
        setErro('Seu e-mail ainda não foi confirmado. Abra o link que enviamos para a sua caixa de entrada.');
      } else if (corpo.erro === 'bloqueado') {
        setErro(`Muitas tentativas incorretas. Por segurança, o acesso desta conta está bloqueado${corpo.ate ? ` até as ${formatarHora(corpo.ate)}` : ' por alguns minutos'}. Você pode redefinir a senha em "Esqueci minha senha".`);
      } else if (corpo.erro === 'limite') {
        setErro('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else {
        setErro('E-mail ou senha incorretos.');
      }
      return;
    }

    const perfis = normalizarPerfisCliente(corpo.perfis);
    const salvo = document.cookie.split('; ').find((c) => c.startsWith('ginkle_perfil='))?.split('=')[1] as Perfil | undefined;
    const padrao = DASHBOARD_POR_PERFIL[salvo && perfis.includes(salvo) ? salvo : 'CLIENTE'];
    router.replace(caminhoSeguro(next, padrao));
    router.refresh();
  }

  return (
    <form onSubmit={entrar} noValidate className="space-y-5">
      <Input rotulo="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <div>
        <div className="relative">
          <Input rotulo="Senha" type={ver ? 'text' : 'password'} autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} className="pr-12" />
          <button
            type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute bottom-0 right-0 inline-flex size-11 items-center justify-center text-muted"
          >
            {ver ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        </div>
        <div className="mt-2 text-right">
          <Link href="/esqueci-senha" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">Esqueci minha senha</Link>
        </div>
      </div>
      {erro && <Alert tipo="erro">{erro}</Alert>}
      {naoConfirmado && <ReenviarEmail email={email.trim()} />}
      <Button type="submit" tamanho="lg" carregando={enviando} className="w-full">Entrar</Button>
      <p className="text-center text-base text-muted">
        Ainda não tem conta? <Link href="/cadastro" className="font-semibold text-accent underline-offset-4 hover:underline">Cadastre-se</Link>
      </p>
    </form>
  );
}
