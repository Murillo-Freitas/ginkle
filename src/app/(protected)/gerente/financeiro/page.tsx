import type { Metadata } from 'next';
import Link from 'next/link';
import { BotaoAcao } from '@/components/features/botao-acao';
import { ModalFormulario } from '@/components/features/formulario-generico';
import { classesBotao } from '@/components/ui/button';
import { Card, PageHeader, Stat } from '@/components/ui/card';
import { Alert, Badge } from '@/components/ui/feedback';
import { estiloCampo, estiloRotulo } from '@/components/ui/estilos';
import { exigirCasaGestor } from '@/lib/auth';
import { listarResidentesCasa, statusMensalidade } from '@/lib/dados';
import { primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { formatarCompetencia, formatarData, formatarMoeda, formatarTelefone, hojeISO } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Financeiro e assinantes' };

interface Mens { id: string; valor: number; data_vencimento: string; status: string; data_pagamento: string | null; numero_recibo: number | null; residente: { nome_completo: string } | null }
interface Resp { id: string; parentesco: string; usuario: { nome_completo: string; email: string; telefone: string } | null; residente: { id: string; nome_completo: string } | null }
interface Fatura { id: string; valor: number; data_vencimento: string; data_pagamento: string | null; status_pagamento: string }

export default async function FinanceiroGestor({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { casa } = await exigirCasaGestor();
  const hoje = hojeISO();
  const mesParam = primeiro((await searchParams).mes);
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(mesParam) ? mesParam : hoje.slice(0, 7);
  const [a, m] = mes.split('-').map(Number);
  const proximo = m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, '0')}-01`;
  const supabase = await createClient();

  const [{ data: md }, { data: rd }, { data: fd }, residentes] = await Promise.all([
    supabase.from('mensalidades').select('id, valor, data_vencimento, status, data_pagamento, numero_recibo, residente:residentes(nome_completo)')
      .eq('ilpi_id', casa.id).gte('competencia', `${mes}-01`).lt('competencia', proximo).order('data_vencimento'),
    supabase.from('familiares_residentes').select('id, parentesco, usuario:usuarios(nome_completo, email, telefone), residente:residentes!inner(id, nome_completo, ilpi_id, status)')
      .eq('residente.ilpi_id', casa.id).eq('responsavel_financeiro', true),
    supabase.from('faturamentos').select('id, valor, data_vencimento, data_pagamento, status_pagamento, assinatura:assinaturas!inner(ilpi_id)')
      .eq('assinatura.ilpi_id', casa.id).order('data_vencimento', { ascending: false }).limit(6),
    listarResidentesCasa(supabase, casa.id, { status: 'ATIVO' }),
  ]);
  const mensalidades = (md ?? []) as unknown as Mens[];
  const responsaveis = (rd ?? []) as unknown as Resp[];
  const faturas = (fd ?? []) as unknown as Fatura[];

  const validas = mensalidades.filter((x) => x.status !== 'CANCELADA');
  const previsto = validas.reduce((t, x) => t + Number(x.valor), 0);
  const recebido = validas.filter((x) => x.status === 'PAGA').reduce((t, x) => t + Number(x.valor), 0);
  const emAtraso = validas.filter((x) => x.status === 'PENDENTE' && x.data_vencimento < hoje).length;
  const comResp = new Set(responsaveis.map((r) => r.residente?.id));
  const semResp = residentes.filter((r) => !comResp.has(r.id));

  return (
    <>
      <PageHeader
        titulo="Financeiro e assinantes"
        descricao="Mensalidades dos residentes, responsáveis financeiros e a assinatura do Ginkle. Os pagamentos são registrados manualmente (sem gateway)."
        acao={
          <>
            <ModalFormulario rotuloBotao="Gerar mensalidades do mês" titulo="Gerar mensalidades" variante="contorno"
              descricao="Cria uma mensalidade com o mesmo valor para todos os residentes ativos que ainda não têm uma nesse mês."
              rotuloEnvio="Gerar" mensagemSucesso="Mensalidades geradas." limparAoConcluir={false}
              campos={[
                { nome: 'p_competencia', rotulo: 'Mês de competência', tipo: 'mes', obrigatorio: true, inicial: mes, largura: 'metade' },
                { nome: 'p_valor', rotulo: 'Valor (R$)', tipo: 'dinheiro', obrigatorio: true, largura: 'metade', placeholder: '3.500,00' },
                { nome: 'p_vencimento', rotulo: 'Vencimento', tipo: 'data', obrigatorio: true },
              ]}
              acao={{ tipo: 'rpc', nome: 'gerar_mensalidades', extra: { p_ilpi: casa.id } }} />
            <ModalFormulario rotuloBotao="Nova mensalidade" titulo="Nova mensalidade"
              rotuloEnvio="Salvar" mensagemSucesso="Mensalidade lançada."
              campos={[
                { nome: 'residente_id', rotulo: 'Residente', tipo: 'select', obrigatorio: true, opcoes: residentes.map((r) => ({ valor: r.id, rotulo: r.nome_completo })) },
                { nome: 'competencia', rotulo: 'Mês de competência', tipo: 'mes', obrigatorio: true, inicial: mes, largura: 'metade' },
                { nome: 'valor', rotulo: 'Valor (R$)', tipo: 'dinheiro', obrigatorio: true, largura: 'metade' },
                { nome: 'data_vencimento', rotulo: 'Vencimento', tipo: 'data', obrigatorio: true },
                { nome: 'observacao', rotulo: 'Observação (opcional)', maxLen: 200 },
              ]}
              acao={{ tipo: 'insert', tabela: 'mensalidades' }} />
          </>
        }
      />

      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div><label htmlFor="mes" className={estiloRotulo}>Mês</label><input id="mes" name="mes" type="month" defaultValue={mes} className={estiloCampo} /></div>
        <button type="submit" className={classesBotao('primario', 'md')}>Ver mês</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat rotulo="Previsto" valor={formatarMoeda(previsto)} />
        <Stat rotulo="Recebido" valor={formatarMoeda(recebido)} />
        <Stat rotulo="Em aberto" valor={formatarMoeda(previsto - recebido)} />
        <Stat rotulo="Em atraso" valor={emAtraso} dica="mensalidades" />
      </div>

      <Card className="mt-6 !p-0">
        <h2 className="p-5 pb-0 text-xl font-bold capitalize">Mensalidades de {formatarCompetencia(`${mes}-01`)}</h2>
        {mensalidades.length === 0 ? (
          <p className="p-5 text-muted">Nenhuma mensalidade lançada neste mês.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-3 w-full min-w-[40rem] text-left">
              <caption className="sr-only">Mensalidades do mês</caption>
              <thead className="border-y border-line text-sm text-muted">
                <tr><th scope="col" className="p-4">Residente</th><th scope="col" className="p-4">Valor</th><th scope="col" className="p-4">Vencimento</th><th scope="col" className="p-4">Situação</th><th scope="col" className="p-4"><span className="sr-only">Ações</span></th></tr>
              </thead>
              <tbody>
                {mensalidades.map((x) => {
                  const st = statusMensalidade(x, hoje);
                  return (
                    <tr key={x.id} className="border-b border-line last:border-0">
                      <td className="p-4">{x.residente?.nome_completo}</td>
                      <td className="p-4 font-semibold">{formatarMoeda(Number(x.valor))}</td>
                      <td className="p-4">{formatarData(x.data_vencimento)}</td>
                      <td className="p-4"><Badge tom={st.tom}>{st.rotulo}</Badge>{x.data_pagamento && <span className="ml-2 text-sm text-muted">em {formatarData(x.data_pagamento)}</span>}</td>
                      <td className="p-4">
                        {x.numero_recibo && <a href={`/relatorios/recibo/${x.id}`} className="font-semibold text-accent underline-offset-4 hover:underline">Recibo nº {String(x.numero_recibo).padStart(6, '0')}</a>}
                        {x.status === 'PENDENTE' && (
                          <span className="flex flex-wrap gap-2">
                            <BotaoAcao rotulo="Marcar como paga" acao={{ tipo: 'update', tabela: 'mensalidades', id: x.id, valores: { status: 'PAGA', data_pagamento: '$hoje' } }} />
                            <BotaoAcao rotulo="Cancelar" acao={{ tipo: 'update', tabela: 'mensalidades', id: x.id, valores: { status: 'CANCELADA' } }} confirmar="Cancelar esta mensalidade?" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <section className="mt-10" aria-labelledby="assinantes">
        <h2 id="assinantes" className="mb-3 text-2xl font-bold">Assinantes (responsáveis financeiros)</h2>
        {semResp.length > 0 && (
          <div className="mb-4"><Alert tipo="aviso" titulo={`${semResp.length} residente(s) sem responsável financeiro`}>
            {semResp.slice(0, 5).map((r, i) => (<span key={r.id}>{i > 0 && ', '}<Link className="font-semibold underline" href={`/gerente/residentes/${r.id}`}>{r.nome_completo}</Link></span>))}
            {semResp.length > 5 ? ' e outros' : ''}. Sem responsável financeiro, ninguém da família vê as mensalidades.
          </Alert></div>
        )}
        {responsaveis.length === 0 ? <p className="text-muted">Nenhum responsável financeiro definido ainda. Defina ao vincular o familiar ao residente.</p> : (
          <Card className="!p-0"><ul className="divide-y divide-line">
            {responsaveis.map((r) => (
              <li key={r.id} className="p-4 sm:p-5">
                <p className="font-semibold">{r.usuario?.nome_completo} <span className="font-normal text-muted">({r.parentesco} de {r.residente?.nome_completo})</span></p>
                <p className="break-all text-sm text-muted">{r.usuario?.email}{r.usuario?.telefone ? ` · ${formatarTelefone(r.usuario.telefone)}` : ''}</p>
              </li>
            ))}
          </ul></Card>
        )}
      </section>

      <section className="mt-10" aria-labelledby="assinatura">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="assinatura" className="text-2xl font-bold">Assinatura do Ginkle</h2>
          <Link href="/gerente/planos" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">Gerenciar plano</Link>
        </div>
        {faturas.length === 0 ? <p className="text-muted">Nenhuma fatura gerada.</p> : (
          <Card className="!p-0"><ul className="divide-y divide-line">
            {faturas.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <span>Vencimento {formatarData(f.data_vencimento)}</span>
                <span className="flex items-center gap-3"><strong>{formatarMoeda(Number(f.valor))}</strong><Badge tom={f.status_pagamento === 'PAGO' ? 'ok' : 'aviso'}>{f.status_pagamento === 'PAGO' ? 'Pago' : 'Pendente'}</Badge></span>
              </li>
            ))}
          </ul></Card>
        )}
      </section>
    </>
  );
}
