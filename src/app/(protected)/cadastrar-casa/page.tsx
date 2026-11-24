import type { Metadata } from 'next';
import { CasaForm } from '@/components/features/casa-form';
import { Alert } from '@/components/ui/feedback';
import { Card, PageHeader } from '@/components/ui/card';
import { exigirSessao } from '@/lib/auth';

export const metadata: Metadata = { title: 'Cadastrar casa de repouso' };

export default async function CadastrarCasaPage() {
  await exigirSessao();
  return (
    <>
      <PageHeader titulo="Cadastrar casa de repouso" descricao="Cadastre a sua casa de repouso para gerenciar residentes, equipe e comunicação com as famílias." />
      <div className="mb-6 max-w-3xl">
        <Alert tipo="info" titulo="O que acontece depois">
          Você passa a ser o gestor da casa e ganha acesso ao painel do gestor. A casa começa com o plano Essencial e só aparece no diretório público quando você publicar.
        </Alert>
      </div>
      <Card className="max-w-3xl"><CasaForm /></Card>
    </>
  );
}
