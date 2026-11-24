'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/feedback';
import type { CasaResumo } from '@/types';

export function SeletorCasa({ casas, ativaId }: { casas: CasaResumo[]; ativaId: string }) {
  const router = useRouter();
  const ativa = casas.find((c) => c.id === ativaId) ?? casas[0];

  function trocar(id: string) {
    document.cookie = `ginkle_casa=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <Building2 aria-hidden className="size-5 text-accent" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Casa de repouso selecionada</p>
        {casas.length > 1 ? (
          <select
            aria-label="Trocar de casa de repouso"
            value={ativa.id}
            onChange={(e) => trocar(e.target.value)}
            className="mt-0.5 min-h-10 max-w-full rounded-lg border border-line bg-surface py-1 pl-2 pr-8 text-base font-semibold"
          >
            {casas.map((c) => <option key={c.id} value={c.id}>{c.nome_fantasia} · {c.cidade}/{c.uf}</option>)}
          </select>
        ) : (
          <p className="truncate font-semibold">{ativa.nome_fantasia} · {ativa.cidade}/{ativa.uf}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {ativa.publicada ? <Badge tom="ok">Publicada</Badge> : <Badge tom="aviso">Não publicada</Badge>}
        <Link href="/cadastrar-casa" className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-accent hover:bg-surface-alt">
          <Plus aria-hidden className="size-4" /> Nova casa
        </Link>
      </div>
    </div>
  );
}

export function BotaoUsarCasa({ id, ativa }: { id: string; ativa: boolean }) {
  const router = useRouter();
  if (ativa) return <Badge tom="marca">Casa selecionada</Badge>;
  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = `ginkle_casa=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        router.push('/gerente/dashboard');
        router.refresh();
      }}
      className="inline-flex min-h-9 items-center rounded-lg border border-line bg-surface px-3 text-sm font-semibold hover:bg-surface-alt"
    >
      Usar esta casa
    </button>
  );
}
