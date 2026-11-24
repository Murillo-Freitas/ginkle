import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { classesBotao } from './button';

export function Paginacao({ pagina, total, porPagina, caminho, params }: {
  pagina: number; total: number; porPagina: number; caminho: string; params: Record<string, string>;
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginas <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams(params);
    sp.set('pagina', String(p));
    return `${caminho}?${sp.toString()}`;
  };

  return (
    <nav aria-label="Paginação" className="mt-6 flex items-center justify-between gap-3">
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} className={classesBotao('contorno', 'md')}>
          <ChevronLeft aria-hidden className="size-4" /> Anterior
        </Link>
      ) : <span />}
      <span className="text-sm text-muted">Página {pagina} de {paginas}</span>
      {pagina < paginas ? (
        <Link href={href(pagina + 1)} className={classesBotao('contorno', 'md')}>
          Próxima <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : <span />}
    </nav>
  );
}
