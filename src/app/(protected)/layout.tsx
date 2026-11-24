import { AppShell } from '@/components/layout/app-shell';
import { exigirSessao } from '@/lib/auth';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const s = await exigirSessao();
  return (
    <AppShell usuarioId={s.id} nome={s.nome} email={s.email} perfis={s.perfis} perfilInicial={s.perfilAtivo}>
      {children}
    </AppShell>
  );
}
