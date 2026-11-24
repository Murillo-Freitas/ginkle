'use client';

import { useEffect } from 'react';

/** Registra o service worker para push e modo offline. localhost é seguro mesmo em HTTP. */
export function RegistrarSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const host = window.location.hostname;
    const ambienteSeguro = window.isSecureContext || host === 'localhost' || host === '127.0.0.1';
    if (!ambienteSeguro) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((erro: unknown) => {
      console.error('[service-worker] Não foi possível registrar /sw.js:', erro);
    });
  }, []);
  return null;
}
