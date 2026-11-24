'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Checkbox } from '@/components/ui/form';
import { Alert } from '@/components/ui/feedback';
import { PushToggle } from './push-toggle';

interface Prefs { push_chat: boolean; push_urgente: boolean; push_solicitacoes: boolean; resumo_diario: boolean }

export function PreferenciasNotificacao({ usuarioId, inicial }: { usuarioId: string; inicial: Prefs }) {
  const [p, setP] = useState<Prefs>(inicial);
  const [msg, setMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  async function alterar(campo: keyof Prefs, valor: boolean) {
    const novo = { ...p, [campo]: valor };
    setP(novo);
    const { error } = await createClient().from('preferencias_notificacao').upsert({ usuario_id: usuarioId, ...novo }, { onConflict: 'usuario_id' });
    setMsg(error ? { tipo: 'erro', texto: 'Não foi possível salvar.' } : { tipo: 'sucesso', texto: 'Preferência salva.' });
  }

  return (
    <div className="space-y-4">
      <PushToggle usuarioId={usuarioId} />
      <div className="border-t border-line pt-3">
        <Checkbox rotulo="Avisar sobre mensagens do chat" checked={p.push_chat} onChange={(e) => alterar('push_chat', e.target.checked)} />
        <Checkbox rotulo="Avisar sobre ocorrências urgentes dos meus familiares" checked={p.push_urgente} onChange={(e) => alterar('push_urgente', e.target.checked)} />
        <Checkbox rotulo="Avisar sobre novas solicitações e respostas" checked={p.push_solicitacoes} onChange={(e) => alterar('push_solicitacoes', e.target.checked)} />
        <Checkbox rotulo="Receber um resumo diário por e-mail (às 18h)" checked={p.resumo_diario} onChange={(e) => alterar('resumo_diario', e.target.checked)} />
      </div>
      {msg && <Alert tipo={msg.tipo}>{msg.texto}</Alert>}
    </div>
  );
}
