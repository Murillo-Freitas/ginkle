import { SeletorCasa } from '@/components/layout/seletor-casa';
import { exigirCasaGestor } from '@/lib/auth';

export default async function GerenteLayout({ children }: { children: React.ReactNode }) {
  const { casa, casas } = await exigirCasaGestor();
  return (
    <>
      <SeletorCasa casas={casas} ativaId={casa.id} />
      {children}
    </>
  );
}
