import type { Metadata } from 'next';
import Link from 'next/link';
import { Activity, Inbox, Landmark, TriangleAlert, Users, UsersRound } from 'lucide-react';
import { RegistrosLista } from '@/components/features/registro-item';
import { LinkButton } from '@/components/ui/button';
import { PageHeader, Stat } from '@/components/ui/card';
import { Alert } from '@/components/ui/feedback';
import { exigirCasaGestor } from '@/lib/auth';
import { contar } from '@/lib/dados';
import { buscarRegistros, inicioDoPeriodo } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { hojeISO } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Painel do gestor' };

export default async function GerenteDashboard() {
  const { casa } = await exigirCasaGestor();
  const supabase = await createClient();
  const desde = inicioDoPeriodo('7d')!;

  const [residentes, equipe, pendentes, registros, urgentes, atrasadas, { data: ass }, recentes] = await Promise.all([
    contar(supabase, 'residentes', { ilpi_id: casa.id, status: 'ATIVO' }),
    contar(supabase, 'vinculos_ilpi', { ilpi_id: casa.id, ativo: true }),
    contar(supabase, 'adesoes_ilpi', { ilpi_id: casa.id, status: 'PENDENTE' }),
    contar(supabase, 'registros_assistenciais', { ilpi_id: casa.id }, { coluna: 'criado_em_dispositivo', valor: desde }),
    contar(supabase, 'registros_assistenciais', { ilpi_id: casa.id, urgente: true }, { coluna: 'criado_em_dispositivo', valor: desde }),
    contar(supabase, 'mensalidades', { ilpi_id: casa.id, status: 'PENDENTE' }, undefined, { coluna: 'data_vencimento', valor: hojeISO() }),
    supabase.from('assinaturas').select('plano:planos(nome, max_residentes)').eq('ilpi_id', casa.id).eq('status', 'ATIVA').maybeSingle(),
    buscarRegistros(supabase, { ilpiId: casa.id, limite: 5 }),
  ]);
  const plano = (ass as unknown as { plano: { nome: string; max_residentes: number | null } } | null)?.plano;

  return (
    <>
      <PageHeader
        titulo="Painel do gestor"
        descricao="Visão geral da casa de repouso."
        acao={<><LinkButton href="/gerente/residentes">Residentes</LinkButton><LinkButton href="/gerente/equipe" variante="contorno">Equipe</LinkButton></>}
      />

      {!casa.publicada && (
        <div className="mb-6">
          <Alert tipo="aviso" titulo="Sua casa de repouso ainda não aparece no diretório público">
            Complete a descrição e a foto e marque “Exibir no diretório” em <Link className="font-semibold underline" href={`/gerente/casas/${casa.id}/editar`}>Editar casa</Link>.
          </Alert>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat rotulo="Residentes ativos" valor={residentes} icone={<UsersRound className="size-5" />} dica={plano?.max_residentes ? `Limite do plano ${plano.nome}: ${plano.max_residentes}` : plano ? `Plano ${plano.nome}: sem limite` : undefined} />
        <Stat rotulo="Equipe ativa" valor={equipe} icone={<Users className="size-5" />} />
        <Stat rotulo="Solicitações pendentes" valor={pendentes} icone={<Inbox className="size-5" />} dica={pendentes > 0 ? 'Aguardando a sua resposta' : undefined} />
        <Stat rotulo="Registros (7 dias)" valor={registros} icone={<Activity className="size-5" />} />
        <Stat rotulo="Ocorrências urgentes (7 dias)" valor={urgentes} icone={<TriangleAlert className="size-5" />} />
        <Stat rotulo="Mensalidades em atraso" valor={atrasadas} icone={<Landmark className="size-5" />} />
      </div>

      <section className="mt-8" aria-labelledby="ultimos">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="ultimos" className="text-xl font-bold">Últimos registros da casa</h2>
          <Link href="/gerente/auditoria" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">Histórico de ações</Link>
        </div>
        {recentes.itens.length === 0 ? <p className="text-muted">Ainda não há registros de cuidado.</p> : <RegistrosLista itens={recentes.itens} mostrarResidente />}
      </section>
    </>
  );
}
