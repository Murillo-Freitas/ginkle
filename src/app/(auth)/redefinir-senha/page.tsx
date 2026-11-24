import type { Metadata } from 'next';
import Link from 'next/link';
import { RedefinirSenhaForm } from '@/components/features/auth/redefinir-senha-form';
import { Alert } from '@/components/ui/feedback';
import { classesBotao } from '@/components/ui/button';
import { getSessao } from '@/lib/auth';

export const metadata: Metadata = { title: 'Nova senha' };

export default async function RedefinirSenhaPage() {
  const sessao = await getSessao();
  if (!sessao) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">Link inválido ou expirado</h1>
        <Alert tipo="aviso">Por segurança, o link de recuperação vale por pouco tempo e só pode ser usado uma vez.</Alert>
        <Link href="/esqueci-senha" className={classesBotao('primario', 'lg', 'w-full')}>Pedir um novo link</Link>
      </div>
    );
  }
  return (
    <>
      <h1 className="text-3xl font-bold">Criar nova senha</h1>
      <p className="mb-6 mt-2 text-muted">Escolha uma senha forte. Depois de salvar, você entrará novamente com ela.</p>
      <RedefinirSenhaForm />
    </>
  );
}
