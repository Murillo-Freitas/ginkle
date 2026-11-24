import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/cn';
import { ehUUID } from '@/utils/validators';
import { formatarDataHora } from '@/utils/formatters';
import { EmptyState } from '@/components/ui/feedback';
import { ChatConversa, type Mensagem } from './chat-conversa';

/** Caixa de entrada da casa de repouso: lista as conversas das famílias e abre a selecionada. */
export async function ChatEquipe({ ilpiId, usuarioId, caminho, conversaId }: {
  ilpiId: string; usuarioId: string; caminho: string; conversaId?: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('conversas')
    .select('id, usuario_nome, ultima_mensagem_em')
    .eq('ilpi_id', ilpiId)
    .order('ultima_mensagem_em', { ascending: false })
    .limit(50);
  const conversas = (data ?? []) as { id: string; usuario_nome: string; ultima_mensagem_em: string }[];

  if (conversas.length === 0) {
    return (
      <EmptyState
        icone={<MessagesSquare className="size-10" />}
        titulo="Nenhuma conversa ainda"
        descricao="Quando um familiar enviar uma mensagem para a casa de repouso, a conversa aparecerá aqui."
      />
    );
  }

  const selecionada = conversas.find((c) => c.id === conversaId) ?? conversas[0];
  const { data: msgs } = ehUUID(selecionada.id)
    ? await supabase
        .from('mensagens')
        .select('id, remetente_id, remetente_nome, remetente_equipe, conteudo, data_hora')
        .eq('conversa_id', selecionada.id)
        .order('data_hora', { ascending: false })
        .limit(100)
    : { data: [] };
  const inicial = ((msgs ?? []) as Mensagem[]).reverse();

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <nav aria-label="Conversas" className="max-h-64 overflow-y-auto rounded-xl border border-line bg-surface p-2 lg:max-h-[60dvh]">
        <ul className="space-y-1">
          {conversas.map((c) => (
            <li key={c.id}>
              <Link
                href={`${caminho}?conversa=${c.id}`}
                aria-current={c.id === selecionada.id ? 'true' : undefined}
                className={cn('block rounded-lg px-3 py-2.5 hover:bg-surface-alt', c.id === selecionada.id && 'bg-surface-alt')}
              >
                <span className="block truncate font-semibold">{c.usuario_nome || 'Familiar'}</span>
                <span className="block text-xs text-muted">Última mensagem: {formatarDataHora(c.ultima_mensagem_em)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <h2 className="mb-2 text-lg font-bold">Conversa com {selecionada.usuario_nome || 'familiar'}</h2>
        <ChatConversa key={selecionada.id} conversaId={selecionada.id} usuarioId={usuarioId} inicial={inicial} />
      </div>
    </div>
  );
}
