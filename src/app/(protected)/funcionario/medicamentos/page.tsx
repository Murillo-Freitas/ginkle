import type { Metadata } from 'next';
import { PaginaTipoRegistro } from '@/components/features/pagina-tipo-registro';

export const metadata: Metadata = { title: 'Medicamentos' };

export default async function Pagina({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <PaginaTipoRegistro
      tipo="MEDICACAO" titulo="Medicamentos" descricao="Administração de medicamentos com dose, lote e situação, para rastreabilidade." caminho="/funcionario/medicamentos"
      searchParams={await searchParams}
    />
  );
}
