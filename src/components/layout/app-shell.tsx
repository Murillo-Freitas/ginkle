'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2, CalendarClock, CalendarDays, ClipboardList, CreditCard, FileClock, HandHeart, HeartPulse, History, Home, Landmark,
  LayoutDashboard, ListChecks, MessageSquare, MoreHorizontal, Pill, PlusCircle, Search, Star, TriangleAlert, UserRound, Users, UsersRound, X,
  Inbox,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { DASHBOARD_POR_PERFIL, NOME_PERFIL } from '@/utils/constants';
import type { Perfil } from '@/types';
import { InatividadeGuard } from './inatividade-guard';
import { Logo } from './logo';
import { SincronizadorOffline } from './sincronizador-offline';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

interface Item { href: string; rotulo: string; icone: LucideIcon; curto?: string }

const NAV: Record<Perfil, Item[]> = {
  CLIENTE: [
    { href: '/cliente/dashboard', rotulo: 'Início', icone: Home },
    { href: '/cliente/residentes', rotulo: 'Meus familiares', curto: 'Familiares', icone: UsersRound },
    { href: '/cliente/cronograma', rotulo: 'Cronograma', icone: CalendarDays },
    { href: '/cliente/solicitacoes', rotulo: 'Solicitações', icone: Inbox },
    { href: '/cliente/financeiro', rotulo: 'Financeiro', icone: CreditCard },
    { href: '/cliente/chat', rotulo: 'Chat e suporte', curto: 'Chat', icone: MessageSquare },
    { href: '/cliente/avaliar', rotulo: 'Avaliar casa', icone: Star },
    { href: '/casas-de-repouso', rotulo: 'Buscar casas de repouso', curto: 'Buscar', icone: Search },
    { href: '/minha-conta', rotulo: 'Perfil', icone: UserRound },
  ],
  FUNCIONARIO: [
    { href: '/funcionario/dashboard', rotulo: 'Meu turno', curto: 'Turno', icone: LayoutDashboard },
    { href: '/funcionario/residentes', rotulo: 'Residentes', icone: UsersRound },
    { href: '/funcionario/registros/novo', rotulo: 'Novo registro', curto: 'Registrar', icone: PlusCircle },
    { href: '/funcionario/cuidados', rotulo: 'Cuidados', icone: HandHeart },
    { href: '/funcionario/medicamentos', rotulo: 'Medicamentos', icone: Pill },
    { href: '/funcionario/sinais-vitais', rotulo: 'Sinais vitais', icone: HeartPulse },
    { href: '/funcionario/ocorrencias', rotulo: 'Ocorrências', icone: TriangleAlert },
    { href: '/funcionario/atividades', rotulo: 'Atividades do dia', curto: 'Atividades', icone: ListChecks },
    { href: '/funcionario/historico', rotulo: 'Histórico de registros', curto: 'Histórico', icone: History },
    { href: '/funcionario/chat', rotulo: 'Chat e suporte', curto: 'Chat', icone: MessageSquare },
    { href: '/funcionario/escala', rotulo: 'Minha escala', curto: 'Escala', icone: CalendarDays },
    { href: '/minha-conta', rotulo: 'Perfil', icone: UserRound },
  ],
  GERENTE: [
    { href: '/gerente/dashboard', rotulo: 'Painel', icone: LayoutDashboard },
    { href: '/gerente/casas', rotulo: 'Minhas casas', curto: 'Casas', icone: Building2 },
    { href: '/gerente/atividades', rotulo: 'Atividades', icone: CalendarClock },
    { href: '/gerente/equipe', rotulo: 'Equipe', icone: Users },
    { href: '/gerente/residentes', rotulo: 'Residentes', icone: UsersRound },
    { href: '/gerente/solicitacoes', rotulo: 'Solicitações', icone: Inbox },
    { href: '/gerente/planos', rotulo: 'Planos', icone: ClipboardList },
    { href: '/gerente/financeiro', rotulo: 'Financeiro e assinantes', curto: 'Financeiro', icone: Landmark },
    { href: '/gerente/auditoria', rotulo: 'Histórico de ações', curto: 'Auditoria', icone: FileClock },
    { href: '/gerente/chat', rotulo: 'Chat e suporte', curto: 'Chat', icone: MessageSquare },
    { href: '/minha-conta', rotulo: 'Perfil', icone: UserRound },
  ],
};

const PRINCIPAIS: Record<Perfil, string[]> = {
  CLIENTE: ['/cliente/dashboard', '/cliente/residentes', '/cliente/chat', '/cliente/financeiro'],
  FUNCIONARIO: ['/funcionario/dashboard', '/funcionario/residentes', '/funcionario/registros/novo', '/funcionario/chat'],
  GERENTE: ['/gerente/dashboard', '/gerente/residentes', '/gerente/equipe', '/gerente/financeiro'],
};

const TITULO_AREA: Record<Perfil, string> = {
  CLIENTE: 'Portal do familiar',
  FUNCIONARIO: 'Painel do funcionário',
  GERENTE: 'Painel do gestor',
};

function areaPorCaminho(pathname: string, padrao: Perfil): Perfil {
  if (pathname.startsWith('/gerente')) return 'GERENTE';
  if (pathname.startsWith('/funcionario')) return 'FUNCIONARIO';
  if (pathname.startsWith('/cliente')) return 'CLIENTE';
  return padrao;
}

export function AppShell({ usuarioId, nome, email, perfis, perfilInicial, children }: {
  usuarioId: string; nome: string; email: string; perfis: Perfil[]; perfilInicial: Perfil; children: ReactNode;
}) {
  const pathname = usePathname();
  const area = areaPorCaminho(pathname, perfilInicial);
  const itens = NAV[area];
  const [maisAberto, setMaisAberto] = useState(false);

  useEffect(() => { setMaisAberto(false); }, [pathname]);

  const ativo = (href: string) => pathname === href || (href !== '/minha-conta' && pathname.startsWith(href + '/'));
  const principais = PRINCIPAIS[area].map((h) => itens.find((i) => i.href === h)).filter((i): i is Item => Boolean(i));

  const linkLateral = (i: Item) => (
    <li key={i.href}>
      <Link
        href={i.href}
        aria-current={ativo(i.href) ? 'page' : undefined}
        className={cn(
          'flex min-h-11 items-center gap-3 rounded-lg px-3 text-base font-medium hover:bg-surface-alt',
          ativo(i.href) && 'bg-primary text-on-primary hover:bg-primary',
        )}
      >
        <i.icone aria-hidden className="size-5 shrink-0" />
        {i.rotulo}
      </Link>
    </li>
  );

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden rounded-full bg-surface-alt px-3 py-1 text-sm font-semibold sm:inline">{TITULO_AREA[area]}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu nome={nome} email={email} perfis={perfis} />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-72 shrink-0 overflow-y-auto border-r border-line bg-surface p-4 md:block">
          <nav aria-label="Menu da área">
            <ul className="space-y-1">{itens.map(linkLateral)}</ul>
          </nav>
          {perfis.length > 1 && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted">Alternar área</p>
              <ul className="mt-2 space-y-1">
                {perfis.filter((p) => p !== area).map((p) => (
                  <li key={p}>
                    <Link href={DASHBOARD_POR_PERFIL[p]} className="flex min-h-11 items-center rounded-lg px-3 text-base hover:bg-surface-alt">
                      {TITULO_AREA[p]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <main id="conteudo" className="min-w-0 flex-1 px-4 py-6 pb-28 sm:px-6 md:pb-10 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <InatividadeGuard />
      {perfis.some((x) => x !== 'CLIENTE') && <SincronizadorOffline usuarioId={usuarioId} />}

      {/* Navegação inferior (celular) */}
      <nav aria-label="Atalhos" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-5">
          {principais.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={ativo(i.href) ? 'page' : undefined}
                className={cn('flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold', ativo(i.href) ? 'text-primary' : 'text-muted')}
              >
                <i.icone aria-hidden className="size-6" />
                <span className="max-w-full truncate">{i.curto ?? i.rotulo}</span>
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMaisAberto(true)}
              aria-expanded={maisAberto}
              className="flex min-h-16 w-full flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold text-muted"
            >
              <MoreHorizontal aria-hidden className="size-6" />
              Mais
            </button>
          </li>
        </ul>
      </nav>

      {maisAberto && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Todas as opções">
          <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/50" onClick={() => setMaisAberto(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-lg font-bold">{TITULO_AREA[area]}</p>
              <button type="button" onClick={() => setMaisAberto(false)} aria-label="Fechar" className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-surface-alt">
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <ul className="space-y-1">{itens.map(linkLateral)}</ul>
            {perfis.length > 1 && (
              <ul className="mt-4 space-y-1 border-t border-line pt-3">
                {perfis.filter((p) => p !== area).map((p) => (
                  <li key={p}>
                    <Link href={DASHBOARD_POR_PERFIL[p]} className="flex min-h-11 items-center rounded-lg px-3 text-base hover:bg-surface-alt">
                      Ir para: {NOME_PERFIL[p] === 'Equipe' ? 'funcionário' : NOME_PERFIL[p].toLowerCase()}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
