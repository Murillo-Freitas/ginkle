import type { Metadata } from 'next';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { ReenviarEmail } from '@/components/features/auth/reenviar-email';
import { primeiro } from '@/lib/registros';

export const metadata: Metadata = { title: 'Verifique seu e-mail' };

export default async function VerifiquePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const email = primeiro((await searchParams).email);
  return (
    <div className="space-y-6 text-center">
      <MailCheck aria-hidden className="mx-auto size-14 text-accent" />
      <h1 className="text-3xl font-bold">Confirme o seu e-mail</h1>
      <p className="text-lg">
        Enviamos um link de confirmação para {email ? <strong className="break-all">{email}</strong> : 'o seu e-mail'}. Abra a mensagem e clique no link para ativar a sua conta.
      </p>
      <p className="text-muted">Não encontrou? Veja a caixa de spam ou lixo eletrônico. Se o e-mail estiver errado, faça o cadastro novamente.</p>
      <ReenviarEmail email={email} />
      <p><Link href="/login" className="font-semibold text-accent underline-offset-4 hover:underline">Já confirmei, quero entrar</Link></p>
    </div>
  );
}
