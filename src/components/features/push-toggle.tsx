'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';

const CHAVE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type Estado = 'carregando' | 'indisponivel' | 'negado' | 'desligado' | 'ligado';

function chaveParaBytes(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function comLimite<T>(promessa: Promise<T>, ms: number, mensagem: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(mensagem)), ms);
    promessa.then(
      (valor) => { window.clearTimeout(timer); resolve(valor); },
      (erro: unknown) => { window.clearTimeout(timer); reject(erro); },
    );
  });
}

async function respostaDaApi(resposta: Response) {
  const corpo = await resposta.json().catch(() => ({})) as { erro?: string };
  if (!resposta.ok) {
    if (resposta.status === 503) throw new Error('O servidor de notificações não está configurado. Confira SUPABASE_SECRET_KEY e as chaves VAPID.');
    throw new Error(corpo.erro || `O servidor recusou a operação (HTTP ${resposta.status}).`);
  }
}

/** Liga ou desliga as notificações push neste aparelho. */
export function PushToggle({ usuarioId: _usuarioId }: { usuarioId: string }) {
  const [estado, setEstado] = useState<Estado>('carregando');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    (async () => {
      const host = window.location.hostname;
      const ambienteSeguro = window.isSecureContext || host === 'localhost' || host === '127.0.0.1';
      if (!CHAVE || !ambienteSeguro || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        if (ativo) setEstado('indisponivel');
        return;
      }
      if (Notification.permission === 'denied') { if (ativo) setEstado('negado'); return; }
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (ativo) setEstado(sub ? 'ligado' : 'desligado');
    })().catch((falha: unknown) => {
      console.error('[push] Falha ao consultar inscrição:', falha);
      if (ativo) setEstado('indisponivel');
    });
    return () => { ativo = false; };
  }, []);

  async function ativar() {
    if (ocupado) return;
    setOcupado(true);
    setErro('');
    try {
      if (!CHAVE) throw new Error('A chave pública VAPID não está configurada no ambiente.');
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        throw new Error('Este navegador não oferece suporte a notificações push.');
      }
      const permissao = await Notification.requestPermission();
      if (permissao !== 'granted') {
        setEstado('negado');
        throw new Error('A permissão de notificações não foi concedida.');
      }

      // Registra sob demanda também: não depende de o componente global já ter terminado.
      await comLimite(navigator.serviceWorker.register('/sw.js', { scope: '/' }), 10_000,
        'O registro do Service Worker demorou mais de 10 segundos. Atualize a página e tente novamente.');
      const reg = await comLimite(navigator.serviceWorker.ready, 12_000,
        'O Service Worker não ficou pronto. Confirme se /sw.js abre no navegador e tente novamente.');
      const existente = await reg.pushManager.getSubscription();
      const sub = existente ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: chaveParaBytes(CHAVE) as unknown as BufferSource,
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('O navegador retornou uma inscrição incompleta. Tente novamente.');
      }

      const resposta = await fetch('/api/push/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, userAgent: navigator.userAgent.slice(0, 200) }),
      });
      await respostaDaApi(resposta);
      setEstado('ligado');
    } catch (falha) {
      console.error('[push] Falha ao ativar notificações:', falha);
      setErro(falha instanceof Error ? falha.message : 'Não foi possível ativar as notificações.');
    } finally {
      setOcupado(false);
    }
  }

  async function desativar() {
    if (ocupado) return;
    setOcupado(true);
    setErro('');
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const resposta = await fetch('/api/push/inscricao', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await respostaDaApi(resposta);
        await sub.unsubscribe();
      }
      setEstado('desligado');
    } catch (falha) {
      console.error('[push] Falha ao desativar notificações:', falha);
      setErro(falha instanceof Error ? falha.message : 'Não foi possível desativar agora.');
    } finally {
      setOcupado(false);
    }
  }

  if (estado === 'carregando') return <p className="text-sm text-muted">Verificando notificações…</p>;
  if (estado === 'indisponivel') {
    return <Alert tipo="info">As notificações exigem navegador compatível, conexão segura (HTTPS ou localhost), Service Worker e chaves VAPID configuradas.</Alert>;
  }
  if (estado === 'negado') {
    return <Alert tipo="aviso">As notificações estão bloqueadas neste navegador. Libere-as nas configurações do site e volte aqui.</Alert>;
  }
  return (
    <div className="space-y-2">
      {estado === 'ligado' ? (
        <>
          <p className="text-sm">Notificações <strong>ativadas</strong> neste aparelho.</p>
          <Button variante="contorno" onClick={desativar} carregando={ocupado}>Desativar neste aparelho</Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">Receba avisos de mensagens, solicitações e ocorrências urgentes, mesmo com o site fechado.</p>
          <Button onClick={ativar} carregando={ocupado}>Ativar notificações</Button>
        </>
      )}
      {erro && <Alert tipo="erro">{erro}</Alert>}
    </div>
  );
}
