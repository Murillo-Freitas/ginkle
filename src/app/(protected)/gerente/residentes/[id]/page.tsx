import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BotaoAcao } from '@/components/features/botao-acao';
import { FiltrosRegistros } from '@/components/features/filtros-registros';
import { ModalFormulario, type CampoConfig } from '@/components/features/formulario-generico';
import { RegistrosLista } from '@/components/features/registro-item';
import { ResidenteCabecalho } from '@/components/features/residente-cabecalho';
import { Download } from 'lucide-react';
import { indicadoresDoDia } from '@/lib/indicadores';
import { classesBotao } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { Paginacao } from '@/components/ui/pagination';
import { exigirCasaGestor } from '@/lib/auth';
import { carregarResidente } from '@/lib/dados';
import { buscarRegistros, paginaDe, primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { PARENTESCOS, TIPOS_SANGUINEOS } from '@/utils/constants';
import { formatarTelefone } from '@/utils/formatters';
import { ehUUID } from '@/utils/validators';

export const metadata: Metadata = { title: 'Residente' };

interface FamiliarLinha {
  id: string; parentesco: string; responsavel_principal: boolean; responsavel_financeiro: boolean;
  usuario: { nome_completo: string; email: string; telefone: string } | null;
}

export default async function ResidenteGestor({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!ehUUID(id)) notFound();
  const { casa } = await exigirCasaGestor();
  const sp = await searchParams;
  const periodo = primeiro(sp.periodo) || '30d';
  const tipo = primeiro(sp.tipo);
  const pagina = paginaDe(sp.pagina);
  const supabase = await createClient();

  const residente = await carregarResidente(supabase, id);
  if (!residente || residente.ilpi_id !== casa.id) notFound();

  const [{ data }, { itens, total }, ind] = await Promise.all([
    supabase.from('familiares_residentes').select('id, parentesco, responsavel_principal, responsavel_financeiro, usuario:usuarios(nome_completo, email, telefone)').eq('residente_id', id),
    buscarRegistros(supabase, { residenteId: id, periodo, tipo: tipo || undefined, pagina }),
    indicadoresDoDia(supabase, [id]),
  ]);
  const familiares = (data ?? []) as unknown as FamiliarLinha[];
  const caminho = `/gerente/residentes/${id}`;
  const params2: Record<string, string> = { periodo };
  if (tipo) params2.tipo = tipo;

  const camposEdicao: CampoConfig[] = [
    { nome: 'nome_completo', rotulo: 'Nome completo', obrigatorio: true, inicial: residente.nome_completo },
    { nome: 'quarto', rotulo: 'Quarto', largura: 'metade', inicial: residente.quarto ?? '' },
    { nome: 'tipo_sanguineo', rotulo: 'Tipo sanguíneo', tipo: 'select', obrigatorio: true, largura: 'metade', inicial: residente.tipo_sanguineo, opcoes: TIPOS_SANGUINEOS.map((t) => ({ valor: t, rotulo: t === 'DESCONHECIDO' ? 'Desconhecido' : t })) },
    { nome: 'alergias', rotulo: 'Alergias', obrigatorio: true, inicial: residente.alergias },
    { nome: 'observacoes_medicas', rotulo: 'Observações médicas', tipo: 'textarea', maxLen: 1000, inicial: residente.observacoes_medicas ?? '' },
  ];

  return (
    <>
      <p className="mb-3 text-sm"><Link href="/gerente/residentes" className="font-semibold text-accent underline-offset-4 hover:underline">← Residentes</Link></p>
      <ResidenteCabecalho r={residente} casa={residente.ilpi} indicador={ind[id]} acoes={<a href={`/relatorios/residente/${id}?periodo=${periodo}`} className={classesBotao('contorno', 'md')}><Download aria-hidden className="size-4" /> Baixar relatório (PDF)</a>} />
      <div className="mt-4">
        <ModalFormulario rotuloBotao="Editar dados do residente" titulo="Editar residente" variante="contorno" rotuloEnvio="Salvar" mensagemSucesso="Dados atualizados."
          limparAoConcluir={false} campos={camposEdicao} acao={{ tipo: 'update', tabela: 'residentes', id }} />
      </div>

      <section className="mt-8" aria-labelledby="familiares">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="familiares" className="text-2xl font-bold">Familiares vinculados</h2>
          <ModalFormulario
            rotuloBotao="Vincular familiar" titulo="Vincular familiar"
            descricao="O familiar precisa ter criado uma conta no Ginkle. Informe o CPF ou o e-mail dele."
            rotuloEnvio="Vincular" mensagemSucesso="Familiar vinculado."
            campos={[
              { nome: 'p_identificador', rotulo: 'CPF ou e-mail do familiar', obrigatorio: true },
              { nome: 'p_parentesco', rotulo: 'Parentesco', tipo: 'select', obrigatorio: true, opcoes: PARENTESCOS.map((p) => ({ valor: p, rotulo: p })) },
              { nome: 'p_principal', rotulo: 'Responsável principal', tipo: 'checkbox' },
              { nome: 'p_financeiro', rotulo: 'Responsável financeiro (vê as mensalidades)', tipo: 'checkbox' },
            ]}
            acao={{ tipo: 'rpc', nome: 'vincular_familiar', extra: { p_residente: id } }}
          />
        </div>
        {familiares.length === 0 ? (
          <EmptyState titulo="Nenhum familiar vinculado" descricao="Vincule ao menos um familiar para que ele acompanhe a rotina deste residente." />
        ) : (
          <Card className="!p-0">
            <ul className="divide-y divide-line">
              {familiares.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="font-semibold">{f.usuario?.nome_completo}</p>
                    <p className="break-all text-sm text-muted">{f.usuario?.email}{f.usuario?.telefone ? ` · ${formatarTelefone(f.usuario.telefone)}` : ''}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{f.parentesco}</Badge>
                    {f.responsavel_principal && <Badge tom="marca">Principal</Badge>}
                    {f.responsavel_financeiro && <Badge tom="ok">Financeiro</Badge>}
                    <BotaoAcao rotulo="Desvincular" acao={{ tipo: 'rpc', nome: 'desvincular_familiar', args: { p_id: f.id } }} confirmar="Desvincular este familiar? Ele deixará de ver os registros do residente." />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <h2 className="mb-3 mt-10 text-2xl font-bold">Histórico de cuidados</h2>
      <FiltrosRegistros caminho={caminho} valores={{ periodo, tipo, residente: '', autor: '' }} />
      {itens.length === 0 ? <EmptyState titulo="Nenhum registro neste filtro" /> : <RegistrosLista itens={itens} />}
      <Paginacao pagina={pagina} total={total} porPagina={10} caminho={caminho} params={params2} />
    </>
  );
}
