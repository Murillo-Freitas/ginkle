import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6', className)}>{children}</section>;
}

export function PageHeader({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold sm:text-3xl">{titulo}</h1>
        {descricao && <p className="mt-1.5 max-w-2xl text-muted">{descricao}</p>}
      </div>
      {acao && <div className="flex shrink-0 flex-wrap gap-2">{acao}</div>}
    </div>
  );
}

export function Stat({ rotulo, valor, dica, icone }: { rotulo: string; valor: ReactNode; dica?: string; icone?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted">{rotulo}</p>
        {icone && <span aria-hidden className="text-accent">{icone}</span>}
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{valor}</p>
      {dica && <p className="mt-1 text-sm text-muted">{dica}</p>}
    </div>
  );
}
