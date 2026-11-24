import type { Metadata } from 'next';
import { ChatEquipe } from '@/components/features/chat-equipe';
import { SemCasaEquipe } from '@/components/features/sem-casa';
import { PageHeader } from '@/components/ui/card';
import { exigirSessao, getCasaEquipe } from '@/lib/auth';
import { primeiro } from '@/lib/registros';

export const metadata: Metadata = { title: 'Chat e suporte' };

export default async function ChatFuncionario({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sessao = await exigirSessao();
  const vinculo = await getCasaEquipe();
  if (!vinculo) return <><PageHeader titulo="Chat e suporte" /><SemCasaEquipe /></>;
  return (
    <>
      <PageHeader titulo="Chat e suporte" descricao="Responda às famílias da casa de repouso. As conversas não podem ser apagadas." />
      <ChatEquipe ilpiId={vinculo.casa.id} usuarioId={sessao.id} caminho="/funcionario/chat" conversaId={primeiro((await searchParams).conversa)} />
    </>
  );
}
