import type { Metadata } from 'next';
import { ChatEquipe } from '@/components/features/chat-equipe';
import { PageHeader } from '@/components/ui/card';
import { exigirCasaGestor, exigirSessao } from '@/lib/auth';
import { primeiro } from '@/lib/registros';

export const metadata: Metadata = { title: 'Chat e suporte' };

export default async function ChatGestor({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sessao = await exigirSessao();
  const { casa } = await exigirCasaGestor();
  return (
    <>
      <PageHeader titulo="Chat e suporte" descricao="Conversas das famílias com a casa de repouso. As mensagens não podem ser apagadas." />
      <ChatEquipe ilpiId={casa.id} usuarioId={sessao.id} caminho="/gerente/chat" conversaId={primeiro((await searchParams).conversa)} />
    </>
  );
}
