'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Atualiza a página quando as tabelas indicadas mudam no banco (Supabase Realtime). */
export function AtualizarAoVivo({ tabelas }: { tabelas: string[] }) {
  const router = useRouter();
  const chave = tabelas.join(',');
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const agendar = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 400);
    };
    let canal = supabase.channel(`vivo-${chave}`);
    for (const tabela of chave.split(',')) canal = canal.on('postgres_changes', { event: '*', schema: 'public', table: tabela }, agendar);
    canal.subscribe();
    return () => { clearTimeout(timer); void supabase.removeChannel(canal); };
  }, [router, chave]);
  return null;
}
