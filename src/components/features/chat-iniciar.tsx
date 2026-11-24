'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';
import { mensagemDeErro } from './formulario-generico';

export function IniciarConversa({ casaId, usuarioId, casaNome }: { casaId: string; usuarioId: string; casaNome: string }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function iniciar() {
    setCarregando(true);
    setErro('');
    const { error } = await createClient().from('conversas').insert({ ilpi_id: casaId, usuario_id: usuarioId });
    setCarregando(false);
    if (error) { setErro(mensagemDeErro(error)); return; }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Button onClick={iniciar} carregando={carregando}>Iniciar conversa com {casaNome}</Button>
      {erro && <Alert tipo="erro">{erro}</Alert>}
    </div>
  );
}
