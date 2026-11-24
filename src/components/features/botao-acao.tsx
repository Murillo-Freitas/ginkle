'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, type Tamanho, type Variante } from '@/components/ui/button';
import { mensagemDeErro } from './formulario-generico';
import { hojeISO } from '@/utils/formatters';
import { notificarPush } from '@/lib/push-cliente';

export type AcaoSimples =
  | { tipo: 'rpc'; nome: string; args: Record<string, unknown> }
  | { tipo: 'update'; tabela: string; id: string; valores: Record<string, unknown> }
  | { tipo: 'delete'; tabela: string; id: string };

/** Botão que executa uma ação no banco (com confirmação opcional) e atualiza a página. "$hoje" vira a data de hoje. */
export function BotaoAcao({ rotulo, acao, confirmar, variante = 'contorno', tamanho = 'sm' }: {
  rotulo: string; acao: AcaoSimples; confirmar?: string; variante?: Variante; tamanho?: Tamanho;
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function executar() {
    if (confirmar && !window.confirm(confirmar)) return;
    setCarregando(true);
    setErro('');
    const supabase = createClient();
    const trocarHoje = (o: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === '$hoje' ? hojeISO() : v]));

    let resultado: { error: { message: string; code?: string } | null };
    if (acao.tipo === 'rpc') resultado = await supabase.rpc(acao.nome, trocarHoje(acao.args));
    else if (acao.tipo === 'update') resultado = await supabase.from(acao.tabela).update(trocarHoje(acao.valores)).eq('id', acao.id);
    else resultado = await supabase.from(acao.tabela).delete().eq('id', acao.id);

    setCarregando(false);
    if (resultado.error) { setErro(mensagemDeErro(resultado.error)); return; }
    if (acao.tipo === 'rpc' && acao.nome === 'responder_solicitacao' && typeof acao.args.p_id === 'string') {
      notificarPush('solicitacao_resposta', acao.args.p_id);
    }
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button variante={variante} tamanho={tamanho} carregando={carregando} onClick={executar}>{rotulo}</Button>
      {erro && <span role="alert" className="text-sm font-medium text-danger">{erro}</span>}
    </span>
  );
}
