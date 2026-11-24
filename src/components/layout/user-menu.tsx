'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DASHBOARD_POR_PERFIL, NOME_PERFIL } from '@/utils/constants';
import { iniciais } from '@/utils/formatters';
import type { Perfil } from '@/types';

export function UserMenu({ nome, email, perfis }: { nome: string; email: string; perfis: Perfil[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  async function sair() {
    await createClient().auth.signOut();
    document.cookie = 'ginkle_perfil=; Max-Age=0; path=/';
    document.cookie = 'ginkle_casa=; Max-Age=0; path=/';
    setAberto(false);
    router.replace('/');
    router.refresh();
  }

  const item = 'flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-base hover:bg-surface-alt';

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1.5 hover:bg-surface-alt"
      >
        <span aria-hidden className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
          {iniciais(nome)}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-semibold sm:inline">{nome.split(' ')[0]}</span>
        <ChevronDown aria-hidden className="hidden size-4 text-muted sm:block" />
        <span className="sr-only">Menu da conta de {nome}</span>
      </button>
      {aberto && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-line bg-surface p-2 shadow-lg">
          <div className="border-b border-line px-3 pb-2 pt-1">
            <p className="truncate font-semibold">{nome}</p>
            <p className="truncate text-sm text-muted">{email}</p>
          </div>
          <div className="py-1">
            {perfis.map((p) => (
              <Link key={p} href={DASHBOARD_POR_PERFIL[p]} role="menuitem" className={item} onClick={() => setAberto(false)}>
                Área do {NOME_PERFIL[p] === 'Equipe' ? 'funcionário' : NOME_PERFIL[p].toLowerCase()}
              </Link>
            ))}
            <Link href="/minha-conta" role="menuitem" className={item} onClick={() => setAberto(false)}>
              <UserRound aria-hidden className="size-4" /> Minha conta
            </Link>
          </div>
          <button type="button" role="menuitem" onClick={sair} className={`${item} border-t border-line text-danger`}>
            <LogOut aria-hidden className="size-4" /> Sair
          </button>
        </div>
      )}
    </div>
  );
}
