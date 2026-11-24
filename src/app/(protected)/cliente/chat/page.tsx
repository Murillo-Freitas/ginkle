import type { Metadata } from 'next';
import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import { ChatConversa, type Mensagem } from '@/components/features/chat-conversa';
import { IniciarConversa } from '@/components/features/chat-iniciar';
import { LinkButton } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/feedback';
import { exigirSessao } from '@/lib/auth';
import { listarFamiliares } from '@/lib/dados';
import { primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/cn';
import { ehUUID } from '@/utils/validators';

export const metadata: Metadata = { title: 'Chat e suporte' };

export default async function ChatFamiliar({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sessao = await exigirSessao();
  const supabase = await createClient();
  const param = primeiro((await searchParams).casa);

  const familiares = await listarFamiliares(supabase, sessao.id);
  const casas = new Map<string, string>();
  for (const f of familiares) if (f.residente.ilpi) casas.set(f.residente.ilpi.id, f.residente.ilpi.nome_fantasia);

  if (ehUUID(param) && !casas.has(param)) {
    const { data } = await supabase.from('ilpis').select('id, nome_fantasia').eq('id', param).maybeSingle();
    const c = data as { id: string; nome_fantasia: string } | null;
    if (c) casas.set(c.id, c.nome_fantasia);
  }

  if (casas.size === 0) {
    return (
      <>
        <PageHeader titulo="Chat e suporte" descricao="Converse diretamente com a equipe da casa de repouso." />
        <EmptyState
          icone={<MessagesSquare className="size-10" />}
          titulo="Escolha uma casa de repouso para conversar"
          descricao="Quando você tiver um familiar vinculado, a conversa com a casa aparece aqui. Você também pode começar uma conversa a partir da página da casa."
          acao={<LinkButton href="/casas-de-repouso">Buscar casas de repouso</LinkButton>}
        />
      </>
    );
  }

  const selecionadaId = casas.has(param) ? param : [...casas.keys()][0];
  const nomeCasa = casas.get(selecionadaId) ?? 'Casa de repouso';
  const { data: conv } = await supabase.from('conversas').select('id').eq('ilpi_id', selecionadaId).eq('usuario_id', sessao.id).maybeSingle();
  const conversaId = (conv as { id: string } | null)?.id;

  let inicial: Mensagem[] = [];
  if (conversaId) {
    const { data } = await supabase
      .from('mensagens')
      .select('id, remetente_id, remetente_nome, remetente_equipe, conteudo, data_hora')
      .eq('conversa_id', conversaId)
      .order('data_hora', { ascending: false })
      .limit(100);
    inicial = ((data ?? []) as Mensagem[]).reverse();
  }

  return (
    <>
      <PageHeader titulo="Chat e suporte" descricao="As conversas ficam guardadas e não podem ser apagadas, servindo como registro da comunicação." />
      {casas.size > 1 && (
        <nav aria-label="Casas de repouso" className="mb-4 flex flex-wrap gap-2">
          {[...casas.entries()].map(([id, nome]) => (
            <Link key={id} href={`/cliente/chat?casa=${id}`} aria-current={id === selecionadaId ? 'true' : undefined}
              className={cn('inline-flex min-h-11 items-center rounded-lg border px-4 font-semibold', id === selecionadaId ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface hover:bg-surface-alt')}>
              {nome}
            </Link>
          ))}
        </nav>
      )}
      <h2 className="mb-2 text-lg font-bold">{nomeCasa}</h2>
      {conversaId ? (
        <ChatConversa key={conversaId} conversaId={conversaId} usuarioId={sessao.id} inicial={inicial} />
      ) : (
        <IniciarConversa casaId={selecionadaId} usuarioId={sessao.id} casaNome={nomeCasa} />
      )}
    </>
  );
}
