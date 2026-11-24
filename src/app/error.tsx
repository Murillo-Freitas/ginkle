'use client';

import { Button } from '@/components/ui/button';

export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="text-3xl font-bold">Algo deu errado</h1>
      <p className="max-w-md text-muted">Não foi possível carregar esta página. Tente novamente. Se o problema continuar, volte mais tarde.</p>
      <Button tamanho="lg" onClick={reset}>Tentar novamente</Button>
    </main>
  );
}
