'use client';

import { RefreshCw, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { EVENTO_FILA, lerFalhas, lerFila, sincronizarFila } from '@/lib/fila-offline';

/** Mostra o estado da conexão e envia os registros guardados no aparelho assim que a internet volta. */
export function SincronizadorOffline({ usuarioId }: { usuarioId: string }) {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pendentes, setPendentes] = useState(0);
  const [rejeitados, setRejeitados] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const atualizar = useCallback(() => {
    setPendentes(lerFila(usuarioId).length);
    setRejeitados(lerFalhas(usuarioId).length);
  }, [usuarioId]);

  const sincronizar = useCallback(async () => {
    if (!navigator.onLine || lerFila(usuarioId).length === 0) return;
    setEnviando(true);
    const r = await sincronizarFila(usuarioId);
    setEnviando(false);
    atualizar();
    if (r.enviados > 0) router.refresh();
  }, [usuarioId, atualizar, router]);

  useEffect(() => {
    setOnline(navigator.onLine);
    atualizar();
    const ligou = () => { setOnline(true); void sincronizar(); };
    const caiu = () => setOnline(false);
    window.addEventListener('online', ligou);
    window.addEventListener('offline', caiu);
    window.addEventListener(EVENTO_FILA, atualizar);
    const timer = setInterval(() => { void sincronizar(); }, 30_000);
    void sincronizar();
    return () => {
      window.removeEventListener('online', ligou);
      window.removeEventListener('offline', caiu);
      window.removeEventListener(EVENTO_FILA, atualizar);
      clearInterval(timer);
    };
  }, [atualizar, sincronizar]);

  if (online && pendentes === 0 && rejeitados === 0) return null;

  return (
    <div role="status" className="fixed inset-x-3 bottom-20 z-30 rounded-xl border border-warn/40 bg-warn-bg p-3 text-sm text-warn shadow-lg md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-start gap-2">
        {!online && <WifiOff aria-hidden className="mt-0.5 size-5 shrink-0" />}
        <div className="min-w-0 flex-1">
          {!online && <p className="font-semibold">Sem conexão. Os registros ficam salvos neste aparelho.</p>}
          {pendentes > 0 && <p>{pendentes} registro(s) aguardando envio.</p>}
          {rejeitados > 0 && <p>{rejeitados} registro(s) foram recusados pelo servidor e ficaram guardados à parte. Avise o gestor.</p>}
        </div>
        {online && pendentes > 0 && (
          <button type="button" onClick={() => void sincronizar()} disabled={enviando} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-warn/40 px-3 font-semibold">
            <RefreshCw aria-hidden className={`size-4 ${enviando ? 'animate-spin' : ''}`} /> Enviar agora
          </button>
        )}
      </div>
    </div>
  );
}
