import type { Metadata } from 'next';
import { PaginaTipoRegistro } from '@/components/features/pagina-tipo-registro';

export const metadata: Metadata = { title: 'Sinais vitais' };

export default async function Pagina({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <PaginaTipoRegistro
      tipo="SINAIS_VITAIS" titulo="Sinais vitais" descricao="Pressão arterial, frequência cardíaca, temperatura, saturação, glicemia e peso." caminho="/funcionario/sinais-vitais"
      searchParams={await searchParams}
    />
  );
}
