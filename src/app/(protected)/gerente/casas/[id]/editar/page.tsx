import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CasaForm, type CasaEdicao } from '@/components/features/casa-form';
import { DocumentosCasa, type DocumentoLinha } from '@/components/features/documentos-casa';
import { Card, PageHeader } from '@/components/ui/card';
import { Alert } from '@/components/ui/feedback';
import { exigirCasaGestor } from '@/lib/auth';
import { primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { ehUUID } from '@/utils/validators';

export const metadata: Metadata = { title: 'Editar casa' };

export default async function EditarCasa({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const novo = primeiro((await searchParams).novo) === '1';
  const { casas } = await exigirCasaGestor();
  if (!ehUUID(id) || !casas.some((c) => c.id === id)) notFound();

  const supabase = await createClient();
  const [{ data }, { data: docs }] = await Promise.all([
    supabase.from('ilpis')
      .select('id, cnpj, razao_social, nome_fantasia, telefone, email, site, descricao, cep, logradouro, numero, complemento, bairro, cidade, uf, logo_url, capa_url, latitude, publicada')
      .eq('id', id).maybeSingle(),
    supabase.from('documentos_ilpi').select('id, tipo, nome_arquivo, caminho, status, criado_em').eq('ilpi_id', id).order('criado_em', { ascending: false }),
  ]);
  const casa = data as unknown as CasaEdicao | null;
  if (!casa) notFound();

  return (
    <>
      <p className="mb-3 text-sm"><Link href={`/gerente/casas/${id}`} className="font-semibold text-accent underline-offset-4 hover:underline">← Detalhes da casa</Link></p>
      <PageHeader titulo="Editar casa de repouso" />
      {novo && (
        <div className="mb-6 max-w-3xl">
          <Alert tipo="sucesso" titulo="Casa cadastrada!">Complete a descrição, envie o logotipo e a foto e marque “Exibir no diretório” quando estiver pronto. Depois, cadastre os residentes e vincule a equipe.</Alert>
        </div>
      )}
      <Card className="max-w-3xl"><CasaForm casa={casa} /></Card>
      <Card className="mt-6 max-w-3xl"><DocumentosCasa casaId={id} documentos={(docs ?? []) as unknown as DocumentoLinha[]} /></Card>
    </>
  );
}
