import type { Metadata } from 'next';
import { RegistroForm } from '@/components/features/registro-form';
import { SemCasaEquipe } from '@/components/features/sem-casa';
import { Card, PageHeader } from '@/components/ui/card';
import { exigirSessao, getCasaEquipe } from '@/lib/auth';
import { listarResidentesCasa } from '@/lib/dados';
import { primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { TIPOS_REGISTRO } from '@/utils/constants';
import { ehUUID } from '@/utils/validators';
import type { TipoRegistro } from '@/types';

export const metadata: Metadata = { title: 'Novo registro' };

export default async function NovoRegistro({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sessao = await exigirSessao();
  const vinculo = await getCasaEquipe();
  if (!vinculo) return <><PageHeader titulo="Novo registro" /><SemCasaEquipe /></>;
  const sp = await searchParams;
  const tipoParam = primeiro(sp.tipo);
  const tipo = (tipoParam in TIPOS_REGISTRO ? tipoParam : 'CUIDADO') as TipoRegistro;
  const residenteParam = primeiro(sp.residente);
  const residentes = await listarResidentesCasa(await createClient(), vinculo.casa.id, { status: 'ATIVO' });

  return (
    <>
      <PageHeader titulo="Novo registro" descricao="Registre cuidados, medicação, sinais vitais ou ocorrências. A família vinculada ao residente enxerga o registro." />
      <Card className="max-w-3xl">
        <RegistroForm
          residentes={residentes.map((r) => ({ id: r.id, nome: r.nome_completo, quarto: r.quarto }))}
          tipoInicial={tipo} residenteInicial={ehUUID(residenteParam) ? residenteParam : ''} usuarioId={sessao.id} emailUsuario={sessao.email}
        />
      </Card>
    </>
  );
}
