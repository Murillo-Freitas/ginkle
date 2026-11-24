import type { Metadata } from 'next';
import { PaginaTipoRegistro } from '@/components/features/pagina-tipo-registro';

export const metadata: Metadata = { title: 'Cuidados' };

export default async function Pagina({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <PaginaTipoRegistro
      tipo="CUIDADO" titulo="Cuidados" descricao="Higiene, alimentação, hidratação, mobilidade, sono e atividades realizadas com os residentes." caminho="/funcionario/cuidados"
      searchParams={await searchParams}
    />
  );
}
