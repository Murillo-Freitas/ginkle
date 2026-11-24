import type { Metadata } from 'next';
import { CadastroForm } from '@/components/features/auth/cadastro-form';

export const metadata: Metadata = { title: 'Criar conta' };

export default function CadastroPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Criar conta</h1>
      <p className="mb-6 mt-2 text-muted">Cadastro de familiar. Se você trabalha em uma casa de repouso, crie a conta aqui e peça ao gestor para vinculá-lo à equipe.</p>
      <CadastroForm />
    </>
  );
}
