import type { Metadata } from 'next';
import { EsqueciSenhaForm } from '@/components/features/auth/esqueci-senha-form';

export const metadata: Metadata = { title: 'Esqueci minha senha' };

export default function EsqueciSenhaPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Esqueci minha senha</h1>
      <p className="mb-6 mt-2 text-muted">Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.</p>
      <EsqueciSenhaForm />
    </>
  );
}
