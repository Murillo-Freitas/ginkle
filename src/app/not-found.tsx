import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { classesBotao } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <h1 className="text-4xl font-bold">Página não encontrada</h1>
      <p className="max-w-md text-muted">O endereço pode ter mudado ou você não tem acesso a este conteúdo.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className={classesBotao('primario', 'lg')}>Ir para o início</Link>
        <Link href="/casas-de-repouso" className={classesBotao('contorno', 'lg')}>Buscar casas de repouso</Link>
      </div>
    </main>
  );
}
