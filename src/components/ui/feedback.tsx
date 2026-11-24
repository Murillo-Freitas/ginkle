import { AlertCircle, AlertTriangle, CheckCircle2, Info, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type TipoAlerta = 'info' | 'sucesso' | 'aviso' | 'erro';

const alertas: Record<TipoAlerta, { classe: string; Icone: typeof Info }> = {
  info: { classe: 'border-line bg-surface-alt text-ink', Icone: Info },
  sucesso: { classe: 'border-line bg-ok-bg text-ok', Icone: CheckCircle2 },
  aviso: { classe: 'border-warn/40 bg-warn-bg text-warn', Icone: AlertTriangle },
  erro: { classe: 'border-danger/40 bg-danger-bg text-danger', Icone: AlertCircle },
};

export function Alert({ tipo = 'info', titulo, children, className }: {
  tipo?: TipoAlerta; titulo?: string; children?: ReactNode; className?: string;
}) {
  const { classe, Icone } = alertas[tipo];
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-lg border p-4 text-sm', classe, className)}>
      <Icone aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className={titulo ? 'mt-1' : undefined}>{children}</div>}
      </div>
    </div>
  );
}

type TomBadge = 'neutro' | 'marca' | 'ok' | 'aviso' | 'perigo';
const tons: Record<TomBadge, string> = {
  neutro: 'bg-surface-alt text-ink border-line',
  marca: 'bg-primary text-on-primary border-transparent',
  ok: 'bg-ok-bg text-ok border-line',
  aviso: 'bg-warn-bg text-warn border-warn/30',
  perigo: 'bg-danger-bg text-danger border-danger/30',
};

export function Badge({ tom = 'neutro', children, className }: { tom?: TomBadge; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', tons[tom], className)}>
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-surface-alt', className)} />;
}

export function EmptyState({ icone, titulo, descricao, acao }: {
  icone?: ReactNode; titulo: string; descricao?: string; acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      {icone && <div className="mb-4 text-accent" aria-hidden>{icone}</div>}
      <h3 className="text-lg font-semibold">{titulo}</h3>
      {descricao && <p className="mt-2 max-w-md text-muted">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

export function Estrelas({ nota, total }: { nota: number; total?: number }) {
  const cheias = Math.round(nota);
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Nota ${nota.toFixed(1)} de 5${total ? `, ${total} avaliações` : ''}`}>
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={cn('size-4', n <= cheias ? 'fill-current text-warn' : 'text-line')} />
        ))}
      </span>
      <span className="text-sm font-semibold">{nota.toFixed(1)}</span>
      {total !== undefined && <span className="text-sm text-muted">({total})</span>}
    </span>
  );
}
