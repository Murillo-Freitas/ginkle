'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

const LIMITE = 90 * 60 * 1000;
const AVISO = 85 * 60 * 1000;
const ATIVIDADE = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

/** Encerra a sessão após 90 minutos sem atividade (com aviso aos 85 minutos). */
export function InatividadeGuard() {
  const ultimo = useRef(Date.now());
  const ultimoPing = useRef(Date.now());
  const emAviso = useRef(false);
  const [aviso, setAviso] = useState(false);
  const [restante, setRestante] = useState(0);

  useEffect(() => {
    const marcar = () => {
      if (emAviso.current) return;
      ultimo.current = Date.now();
      if (Date.now() - ultimoPing.current > 10 * 60 * 1000) {
        ultimoPing.current = Date.now();
        void fetch('/api/ping', { method: 'POST' }).catch(() => undefined);
      }
    };
    ATIVIDADE.forEach((e) => window.addEventListener(e, marcar, { passive: true }));

    const sair = async () => {
      await createClient().auth.signOut();
      window.location.assign('/login?aviso=sessao_expirada');
    };
    const verificar = () => {
      const parado = Date.now() - ultimo.current;
      if (parado >= LIMITE) { void sair(); return; }
      if (parado >= AVISO) {
        emAviso.current = true;
        setAviso(true);
        setRestante(Math.max(0, Math.ceil((LIMITE - parado) / 1000)));
      }
    };
    const timer = setInterval(verificar, 15_000);
    const aoVoltar = () => { if (document.visibilityState === 'visible') verificar(); };
    document.addEventListener('visibilitychange', aoVoltar);

    return () => {
      ATIVIDADE.forEach((e) => window.removeEventListener(e, marcar));
      clearInterval(timer);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, []);

  function continuar() {
    ultimo.current = Date.now();
    ultimoPing.current = Date.now();
    emAviso.current = false;
    setAviso(false);
    void fetch('/api/ping', { method: 'POST' }).catch(() => undefined);
  }

  return (
    <Modal aberto={aviso} aoFechar={continuar} titulo="Você ainda está aí?">
      <p>Por segurança, sua sessão será encerrada em cerca de {Math.ceil(restante / 60)} minuto(s) por inatividade.</p>
      <div className="mt-5"><Button onClick={continuar} tamanho="lg" className="w-full sm:w-auto">Continuar conectado</Button></div>
    </Modal>
  );
}
