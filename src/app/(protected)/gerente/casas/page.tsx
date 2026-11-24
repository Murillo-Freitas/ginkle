import type { Metadata } from 'next';
import Link from 'next/link';
import { BotaoUsarCasa } from '@/components/layout/seletor-casa';
import { LinkButton } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/feedback';
import { exigirCasaGestor } from '@/lib/auth';

export const metadata: Metadata = { title: 'Minhas casas' };

export default async function MinhasCasas() {
  const { casa, casas } = await exigirCasaGestor();
  return (
    <>
      <PageHeader titulo="Minhas casas" descricao="Casas de repouso que você gerencia. Escolha qual delas aparece nas demais telas do painel." acao={<LinkButton href="/cadastrar-casa">Cadastrar nova casa</LinkButton>} />
      <ul className="grid gap-4 md:grid-cols-2">
        {casas.map((c) => (
          <li key={c.id} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">{c.nome_fantasia}</h2>
              {c.publicada ? <Badge tom="ok">Publicada</Badge> : <Badge tom="aviso">Não publicada</Badge>}
              {c.verificada && <Badge tom="ok">Verificada</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted">{c.cidade}/{c.uf}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href={`/gerente/casas/${c.id}`} className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-sm font-semibold hover:bg-surface-alt">Detalhes</Link>
              <Link href={`/gerente/casas/${c.id}/editar`} className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-sm font-semibold hover:bg-surface-alt">Editar</Link>
              <BotaoUsarCasa id={c.id} ativa={c.id === casa.id} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
