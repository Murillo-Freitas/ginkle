'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';
import { mensagemDeErro } from './formulario-generico';
import { cn } from '@/lib/cn';
import { SITUACOES_PRESENCA } from '@/utils/constants';

export interface LinhaPresenca { residenteId: string; nome: string; registroId: string | null; situacao: string | null }

/** Marcação de presença com um clique por residente. */
export function PresencaAtividade({ atividadeId, data, linhas }: { atividadeId: string; data: string; linhas: LinhaPresenca[] }) {
  const router = useRouter();
  const [estado, setEstado] = useState(() => Object.fromEntries(linhas.map((l) => [l.residenteId, { id: l.registroId, situacao: l.situacao }])));
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  async function marcar(residenteId: string, situacao: string): Promise<boolean> {
    const atual = estado[residenteId];
    const supabase = createClient();
    setOcupado(residenteId);
    setErro('');
    let falha: { message: string; code?: string } | null = null;
    let novoId = atual?.id ?? null;
    if (atual?.id) {
      ({ error: falha } = await supabase.from('atividade_registros').update({ situacao }).eq('id', atual.id));
    } else {
      const r = await supabase.from('atividade_registros').insert({ atividade_id: atividadeId, residente_id: residenteId, data, situacao }).select('id').single();
      falha = r.error;
      novoId = (r.data as { id: string } | null)?.id ?? null;
    }
    setOcupado(null);
    if (falha) { setErro(mensagemDeErro(falha)); return false; }
    setEstado((e) => ({ ...e, [residenteId]: { id: novoId, situacao } }));
    return true;
  }

  async function marcarTodos() {
    for (const l of linhas) {
      if (!estado[l.residenteId]?.situacao) {
        const ok = await marcar(l.residenteId, 'PARTICIPOU');
        if (!ok) break;
      }
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line">
        {linhas.map((l) => (
          <li key={l.residenteId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium">{l.nome}</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label={`Presença de ${l.nome}`}>
              {Object.entries(SITUACOES_PRESENCA).map(([valor, rotulo]) => (
                <button
                  key={valor} type="button" disabled={ocupado === l.residenteId}
                  aria-pressed={estado[l.residenteId]?.situacao === valor}
                  onClick={async () => { if (await marcar(l.residenteId, valor)) router.refresh(); }}
                  className={cn('min-h-10 rounded-lg border px-3 text-sm font-semibold',
                    estado[l.residenteId]?.situacao === valor ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface hover:bg-surface-alt')}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {erro && <Alert tipo="erro">{erro}</Alert>}
      <Button variante="contorno" tamanho="sm" onClick={marcarTodos}>Marcar todos os pendentes como “Participou”</Button>
    </div>
  );
}
