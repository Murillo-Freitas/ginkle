import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Variante = 'primario' | 'secundario' | 'contorno' | 'perigo' | 'texto';
export type Tamanho = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60 select-none text-center';
const variantes: Record<Variante, string> = {
  primario: 'bg-primary text-on-primary hover:bg-primary-hover',
  secundario: 'bg-surface-alt text-ink hover:bg-line',
  contorno: 'border border-line bg-surface text-ink hover:bg-surface-alt',
  perigo: 'bg-danger-solid text-white hover:opacity-90',
  texto: 'text-accent underline-offset-4 hover:underline',
};
const tamanhos: Record<Tamanho, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-base',
  lg: 'min-h-12 px-6 text-base',
};

export function classesBotao(variante: Variante = 'primario', tamanho: Tamanho = 'md', extra?: string) {
  return cn(base, variantes[variante], tamanhos[tamanho], extra);
}

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
}

export function Button({ variante, tamanho, carregando, className, children, disabled, type = 'button', ...props }: BotaoProps) {
  return (
    <button type={type} disabled={disabled || carregando} className={classesBotao(variante, tamanho, className)} {...props}>
      {carregando && (
        <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export function LinkButton({
  href, variante, tamanho, className, children,
}: { href: string; variante?: Variante; tamanho?: Tamanho; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={classesBotao(variante, tamanho, className)}>
      {children}
    </Link>
  );
}
