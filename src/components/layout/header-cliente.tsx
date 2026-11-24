'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { classesBotao } from '@/components/ui/button';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import type { Perfil } from '@/types';

const LINKS = [
  { href: '/', rotulo: 'Início' },
  { href: '/casas-de-repouso', rotulo: 'Casas de repouso' },
  { href: '/sobre', rotulo: 'Sobre nós' },
];

export function HeaderCliente({ usuario }: { usuario: { nome: string; email: string; perfis: Perfil[] } | null }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const ativo = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={ativo(l.href) ? 'page' : undefined}
              className={cn('rounded-lg px-3 py-2 text-base font-medium hover:bg-surface-alt', ativo(l.href) && 'bg-surface-alt font-semibold')}
            >
              {l.rotulo}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {usuario ? (
            <UserMenu {...usuario} />
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className={classesBotao('contorno', 'md')}>Entrar</Link>
              <Link href="/cadastro" className={classesBotao('primario', 'md')}>Cadastre-se</Link>
            </div>
          )}
          <button
            type="button"
            onClick={() => setAberto((a) => !a)}
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
            className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-surface-alt md:hidden"
          >
            {aberto ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
          </button>
        </div>
      </div>
      {aberto && (
        <nav id="menu-mobile" aria-label="Menu" className="border-t border-line bg-surface px-4 pb-4 pt-2 md:hidden">
          <ul className="space-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setAberto(false)} className="flex min-h-12 items-center rounded-lg px-3 text-lg font-medium hover:bg-surface-alt">
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
          {!usuario && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/login" onClick={() => setAberto(false)} className={classesBotao('contorno', 'lg')}>Entrar</Link>
              <Link href="/cadastro" onClick={() => setAberto(false)} className={classesBotao('primario', 'lg')}>Cadastre-se</Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
