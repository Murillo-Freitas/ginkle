'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    setEscuro(document.documentElement.classList.contains('dark'));
  }, []);

  function alternar() {
    const proximo = !escuro;
    document.documentElement.classList.toggle('dark', proximo);
    try { localStorage.setItem('ginkle-tema', proximo ? 'dark' : 'light'); } catch { /* ignora */ }
    setEscuro(proximo);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
      className="inline-flex size-11 items-center justify-center rounded-lg text-ink hover:bg-surface-alt"
    >
      {escuro ? <Sun aria-hidden className="size-5" /> : <Moon aria-hidden className="size-5" />}
    </button>
  );
}
