import { ClipboardX } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { exigirSessao, getCasaEquipe } from '@/lib/auth';
import { listarResidentesCasa } from '@/lib/dados';
import { buscarRegistros, paginaDe, primeiro } from '@/lib/registros';
import { Card, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/feedback';
import { Paginacao } from '@/components/ui/pagination';
import { FiltrosRegistros } from './filtros-registros';
import { RegistroForm } from './registro-form';
import { RegistrosLista } from './registro-item';
import { SemCasaEquipe } from './sem-casa';
import type { TipoRegistro } from '@/types';

/** Página do funcionário para um tipo de registro: formulário rápido + histórico filtrável. */
export async function PaginaTipoRegistro({ tipo, titulo, descricao, caminho, searchParams }: {
  tipo: TipoRegistro; titulo: string; descricao: string; caminho: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const sessao = await exigirSessao();
  const vinculo = await getCasaEquipe();
  if (!vinculo) return <SemCasaEquipe />;

  const supabase = await createClient();
  const periodo = primeiro(searchParams.periodo) || '30d';
  const residente = primeiro(searchParams.residente);
  const pagina = paginaDe(searchParams.pagina);

  const [residentes, { itens, total }] = await Promise.all([
    listarResidentesCasa(supabase, vinculo.casa.id, { status: 'ATIVO' }),
    buscarRegistros(supabase, { ilpiId: vinculo.casa.id, tipo, periodo, residenteId: residente || undefined, pagina }),
  ]);

  const params: Record<string, string> = { periodo };
  if (residente) params.residente = residente;

  return (
    <>
      <PageHeader titulo={titulo} descricao={descricao} />
      <Card className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Novo registro</h2>
        <RegistroForm
          residentes={residentes.map((r) => ({ id: r.id, nome: r.nome_completo, quarto: r.quarto }))}
          tipoInicial={tipo} tipoFixo residenteInicial={residente} usuarioId={sessao.id} emailUsuario={sessao.email}
        />
      </Card>

      <h2 className="mb-3 text-xl font-bold">Histórico</h2>
      <FiltrosRegistros
        caminho={caminho} mostrarTipo={false}
        valores={{ periodo, tipo, residente, autor: '' }}
        residentes={residentes.map((r) => ({ id: r.id, nome: r.nome_completo }))}
      />
      {itens.length === 0 ? (
        <EmptyState icone={<ClipboardX className="size-10" />} titulo="Nenhum registro encontrado" descricao="Altere o período ou o residente, ou crie o primeiro registro acima." />
      ) : (
        <RegistrosLista itens={itens} mostrarResidente />
      )}
      <Paginacao pagina={pagina} total={total} porPagina={10} caminho={caminho} params={params} />
    </>
  );
}
