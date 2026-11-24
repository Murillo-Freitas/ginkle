import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { LinkButton } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { Indicadores } from '@/components/features/semaforo';
import { indicadoresDoDia } from '@/lib/indicadores';
import { exigirSessao } from '@/lib/auth';
import { listarFamiliares } from '@/lib/dados';
import { createClient } from '@/lib/supabase/server';
import { calcularIdade } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Meus familiares' };

export default async function ResidentesDoFamiliar() {
  const sessao = await exigirSessao();
  const supabase = await createClient();
  const familiares = await listarFamiliares(supabase, sessao.id);
  const ind = await indicadoresDoDia(supabase, familiares.map((f) => f.residente.id));

  return (
    <>
      <PageHeader titulo="Meus familiares" descricao="Residentes vinculados à sua conta. Toque em um deles para ver a linha do tempo de cuidados." />
      {familiares.length === 0 ? (
        <EmptyState
          icone={<Search className="size-10" />}
          titulo="Nenhum familiar vinculado"
          descricao="Peça à casa de repouso para vincular o seu CPF ou e-mail, ou envie uma solicitação pelo Ginkle."
          acao={<LinkButton href="/cliente/solicitacoes">Fazer uma solicitação</LinkButton>}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {familiares.map((f) => (
            <li key={f.id}>
              <Link href={`/cliente/residentes/${f.residente.id}`} className="block h-full rounded-xl border border-line bg-surface p-5 shadow-sm hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-semibold">{f.residente.nome_completo}</p>
                  <Badge tom={f.residente.status === 'ATIVO' ? 'ok' : 'neutro'}>{f.residente.status === 'ATIVO' ? 'Ativo' : 'Inativo'}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{calcularIdade(f.residente.data_nascimento)} anos · {f.parentesco}{f.responsavel_principal ? ' · Responsável principal' : ''}</p>
                <p className="mt-2 text-sm">{f.residente.ilpi?.nome_fantasia} · {f.residente.ilpi?.cidade}/{f.residente.ilpi?.uf}</p>
                <div className="mt-3"><Indicadores indicador={ind[f.residente.id]} /></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
