import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export function Logo({ href = '/', className, tamanho = 36 }: { href?: string; className?: string; tamanho?: number }) {
  return (
    <Link href={href} aria-label="Ginkle, página inicial" className={cn('inline-flex items-center gap-2.5', className)}>
      <Image src="/brand/marca-claro.svg" alt="" width={tamanho} height={tamanho} className="dark:hidden" priority />
      <Image src="/brand/marca-escuro.svg" alt="" width={tamanho} height={tamanho} className="hidden dark:block" priority />
      <span className="font-display text-xl font-bold tracking-tight">
        <span className="text-brand-700 dark:text-brand-500">Gink</span>
        <span className="text-ink">le</span>
      </span>
    </Link>
  );
}
