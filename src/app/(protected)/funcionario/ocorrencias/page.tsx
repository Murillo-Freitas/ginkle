import type { Metadata } from 'next';
import { PaginaTipoRegistro } from '@/components/features/pagina-tipo-registro';

export const metadata: Metadata = { title: 'Ocorrências' };

export default async function Pagina({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <PaginaTipoRegistro
      tipo="OCORRENCIA" titulo="Ocorrências" descricao="Quedas, mal-estar e outras ocorrências. Marque como urgente para destacar à família." caminho="/funcionario/ocorrencias"
      searchParams={await searchParams}
    />
  );
}
