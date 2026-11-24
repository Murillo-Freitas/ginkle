import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, PageHeader } from '@/components/ui/card';
import { Alert, Badge } from '@/components/ui/feedback';
import { LinkButton } from '@/components/ui/button';
import { exigirCasaGestor } from '@/lib/auth';
import { contar } from '@/lib/dados';
import { createClient } from '@/lib/supabase/server';
import { enderecoEmLinha, formatarCEP, formatarCNPJ, formatarMoeda, formatarTelefone } from '@/utils/formatters';
import { ehUUID } from '@/utils/validators';

export const metadata: Metadata = { title: 'Detalhes da casa' };

export default async function DetalhesCasa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { casas } = await exigirCasaGestor();
  if (!ehUUID(id) || !casas.some((c) => c.id === id)) notFound();
  const supabase = await createClient();

  const [{ data }, residentes, equipe, { data: ass }] = await Promise.all([
    supabase.from('ilpis').select('id, cnpj, razao_social, nome_fantasia, telefone, email, site, descricao, cep, logradouro, numero, complemento, bairro, cidade, uf, logo_url, capa_url, publicada, verificada, criado_em').eq('id', id).maybeSingle(),
    contar(supabase, 'residentes', { ilpi_id: id, status: 'ATIVO' }),
    contar(supabase, 'vinculos_ilpi', { ilpi_id: id, ativo: true }),
    supabase.from('assinaturas').select('data_inicio, plano:planos(nome, valor_mensal, max_residentes)').eq('ilpi_id', id).eq('status', 'ATIVA').maybeSingle(),
  ]);
  const c = data as unknown as {
    id: string; cnpj: string; razao_social: string; nome_fantasia: string; telefone: string | null; email: string | null; site: string | null;
    descricao: string | null; cep: string; logradouro: string | null; numero: string | null; complemento: string | null; bairro: string | null;
    cidade: string; uf: string; capa_url: string | null; publicada: boolean; verificada: boolean;
  } | null;
  if (!c) notFound();
  const plano = (ass as unknown as { plano: { nome: string; valor_mensal: number; max_residentes: number | null } } | null)?.plano;
  const dt = 'text-sm font-semibold text-muted';

  return (
    <>
      <PageHeader
        titulo={c.nome_fantasia} descricao={enderecoEmLinha(c)}
        acao={<><LinkButton href={`/gerente/casas/${c.id}/editar`}>Editar casa</LinkButton>{c.publicada && <LinkButton href={`/casas-de-repouso/${c.id}`} variante="contorno">Ver página pública</LinkButton>}</>}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {c.publicada ? <Badge tom="ok">Publicada no diretório</Badge> : <Badge tom="aviso">Não publicada</Badge>}
        {c.verificada ? <Badge tom="ok">Verificada pela equipe Ginkle</Badge> : <Badge>Aguardando verificação</Badge>}
      </div>
      {!c.verificada && <div className="mb-6"><Alert tipo="info">A verificação (conferência de CNPJ e documentos) é feita pela equipe do Ginkle. Enquanto isso, a casa pode operar normalmente.</Alert></div>}

      {c.capa_url && (
        <div className="relative mb-6 aspect-[16/6] overflow-hidden rounded-xl bg-surface-alt">
          <Image src={c.capa_url} alt="" fill sizes="(min-width: 1024px) 960px, 100vw" className="object-cover" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Dados cadastrais</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><dt className={dt}>Razão social</dt><dd>{c.razao_social}</dd></div>
            <div><dt className={dt}>CNPJ</dt><dd>{formatarCNPJ(c.cnpj)}</dd></div>
            <div><dt className={dt}>Telefone</dt><dd>{c.telefone ? formatarTelefone(c.telefone) : 'Não informado'}</dd></div>
            <div><dt className={dt}>E-mail</dt><dd className="break-all">{c.email ?? 'Não informado'}</dd></div>
            <div className="sm:col-span-2"><dt className={dt}>Endereço</dt><dd>{enderecoEmLinha(c)} · CEP {formatarCEP(c.cep)}{c.complemento ? ` · ${c.complemento}` : ''}</dd></div>
          </dl>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Operação</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><dt className={dt}>Residentes ativos</dt><dd className="text-2xl font-bold">{residentes}</dd></div>
            <div><dt className={dt}>Equipe ativa</dt><dd className="text-2xl font-bold">{equipe}</dd></div>
            <div className="sm:col-span-2">
              <dt className={dt}>Plano atual</dt>
              <dd>{plano ? `${plano.nome} · ${formatarMoeda(Number(plano.valor_mensal))}/mês · ${plano.max_residentes ? `até ${plano.max_residentes} residentes` : 'sem limite de residentes'}` : 'Sem assinatura ativa'}</dd>
              <Link href="/gerente/planos" className="mt-1 inline-block text-sm font-semibold text-accent underline-offset-4 hover:underline">Gerenciar plano</Link>
            </div>
          </dl>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-bold">Descrição pública</h2>
          <p className="mt-2 whitespace-pre-line">{c.descricao ?? 'Sem descrição. Adicione uma para publicar a casa no diretório.'}</p>
        </Card>
      </div>
    </>
  );
}
