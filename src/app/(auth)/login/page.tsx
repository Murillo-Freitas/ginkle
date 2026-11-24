import type { Metadata } from 'next';
import { LoginForm } from '@/components/features/auth/login-form';
import { Alert } from '@/components/ui/feedback';
import { primeiro } from '@/lib/registros';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const aviso = primeiro(sp.aviso);
  const erro = primeiro(sp.erro);
  return (
    <>
      <h1 className="text-3xl font-bold">Entrar</h1>
      <p className="mb-6 mt-2 text-muted">Acesse a sua conta para acompanhar ou gerenciar o cuidado.</p>
      <div className="mb-5 space-y-3">
        {aviso === 'senha_alterada' && <Alert tipo="sucesso">Senha alterada com sucesso. Entre com a nova senha.</Alert>}
        {aviso === 'sessao_expirada' && <Alert tipo="aviso">Sua sessão foi encerrada por inatividade. Entre novamente para continuar.</Alert>}
        {aviso === 'email_confirmado' && <Alert tipo="sucesso">E-mail confirmado. Agora é só entrar.</Alert>}
        {erro === 'link_invalido' && (
          <Alert tipo="erro">O link é inválido ou expirou. Peça um novo e-mail de confirmação ou de recuperação de senha.</Alert>
        )}
      </div>
      <LoginForm next={primeiro(sp.next)} />
    </>
  );
}
