'use client';

import { Send } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';
import { cn } from '@/lib/cn';
import { formatarDataHora } from '@/utils/formatters';
import { mensagemDeErro } from './formulario-generico';
import { notificarPush } from '@/lib/push-cliente';

export interface Mensagem {
  id: string;
  remetente_id: string;
  remetente_nome: string;
  remetente_equipe: boolean;
  conteudo: string;
  data_hora: string;
}

const COLUNAS = 'id, remetente_id, remetente_nome, remetente_equipe, conteudo, data_hora';

/** Conversa em tempo real (Supabase Realtime). As mensagens não podem ser apagadas. */
export function ChatConversa({ conversaId, usuarioId, inicial }: { conversaId: string; usuarioId: string; inicial: Mensagem[] }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>(inicial);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const lista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`conversa-${conversaId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `conversa_id=eq.${conversaId}` }, (payload) => {
        const nova = payload.new as Mensagem;
        setMensagens((ms) => (ms.some((m) => m.id === nova.id) ? ms : [...ms, nova]));
      })
      .subscribe();
    return () => { void supabase.removeChannel(canal); };
  }, [conversaId]);

  useEffect(() => {
    const el = lista.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensagens.length]);

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo) return;
    setEnviando(true);
    setErro('');
    const { data, error } = await createClient()
      .from('mensagens')
      .insert({ conversa_id: conversaId, conteudo })
      .select(COLUNAS)
      .single();
    setEnviando(false);
    if (error) { setErro(mensagemDeErro(error)); return; }
    const nova = data as Mensagem;
    setMensagens((ms) => (ms.some((m) => m.id === nova.id) ? ms : [...ms, nova]));
    setTexto('');
    notificarPush('mensagem', nova.id);
  }

  return (
    <div className="flex h-[60dvh] min-h-[22rem] flex-col rounded-xl border border-line bg-surface">
      <div ref={lista} role="log" aria-live="polite" aria-label="Mensagens" className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensagens.length === 0 && <p className="py-10 text-center text-muted">Nenhuma mensagem ainda. Escreva abaixo para começar.</p>}
        {mensagens.map((m) => {
          const minha = m.remetente_id === usuarioId;
          return (
            <div key={m.id} className={cn('flex', minha ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[85%] rounded-2xl px-4 py-2.5', minha ? 'bg-primary text-on-primary' : 'bg-surface-alt text-ink')}>
                {!minha && <p className="text-xs font-semibold">{m.remetente_nome}{m.remetente_equipe ? ' · Casa de repouso' : ''}</p>}
                <p className="whitespace-pre-line break-words">{m.conteudo}</p>
                <p className={cn('mt-1 text-xs', minha ? 'text-on-primary/80' : 'text-muted')}>{formatarDataHora(m.data_hora)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={enviar} className="border-t border-line p-3">
        {erro && <div className="mb-2"><Alert tipo="erro">{erro}</Alert></div>}
        <div className="flex items-end gap-2">
          <label htmlFor="msg" className="sr-only">Mensagem</label>
          <textarea
            id="msg" rows={2} maxLength={2000} value={texto} onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
            placeholder="Escreva sua mensagem…"
            className="min-h-11 flex-1 resize-none rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base"
          />
          <Button type="submit" carregando={enviando} aria-label="Enviar mensagem"><Send aria-hidden className="size-5" /></Button>
        </div>
      </form>
    </div>
  );
}
