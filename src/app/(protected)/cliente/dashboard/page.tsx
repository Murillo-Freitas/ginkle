import type { Metadata } from 'next';
import Link from 'next/link';
import { Activity, MessageSquare, Search, TriangleAlert, UsersRound } from 'lucide-react';
import { RegistrosLista } from '@/components/features/registro-item';
import { Indicadores } from '@/components/features/semaforo';
import { indicadoresDoDia } from '@/lib/indicadores';
import { LinkButton } from '@/components/ui/button';
import { Card, PageHeader, Stat } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/feedback';
import { exigirSessao } from '@/lib/auth';
import { contar, listarFamiliares } from '@/lib/dados';
import { buscarRegistros, inicioDoPeriodo } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { calcularIdade } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Início' };

export default async function ClienteDashboard() {
  const sessao = await exigirSessao();
  const supabase = await createClient();
  const desde = inicioDoPeriodo('7d')!;

  const [familiares, recentes, atualizacoes, urgentes] = await Promise.all([
    listarFamiliares(supabase, sessao.id),
    buscarRegistros(supabase, { periodo: '7d', limite: 5 }),
    contar(supabase, 'registros_assistenciais', {}, { coluna: 'criado_em_dispositivo', valor: desde }),
    contar(supabase, 'registros_assistenciais', { urgente: true }, { coluna: 'criado_em_dispositivo', valor: desde }),
  ]);
  const ind = await indicadoresDoDia(supabase, familiares.map((f) => f.residente.id));

  return (
    <>
      <PageHeader titulo={`Olá, ${sessao.nome.split(' ')[0]}`} descricao="Acompanhe o cuidado dos seus familiares e fale com a casa de repouso." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat rotulo="Familiares vinculados" valor={familiares.length} icone={<UsersRound className="size-5" />} />
        <Stat rotulo="Atualizações (7 dias)" valor={atualizacoes} icone={<Activity className="size-5" />} />
        <Stat rotulo="Ocorrências urgentes (7 dias)" valor={urgentes} icone={<TriangleAlert className="size-5" />} dica={urgentes > 0 ? 'Veja os detalhes na linha do tempo' : 'Nenhuma ocorrência urgente'} />
      </div>

      <section className="mt-8" aria-labelledby="meus-familiares">
        <h2 id="meus-familiares" className="mb-3 text-xl font-bold">Meus familiares</h2>
        {familiares.length === 0 ? (
          <EmptyState
            icone={<Search className="size-10" />}
            titulo="Você ainda não tem familiares vinculados"
            descricao="A casa de repouso vincula o familiar pelo seu CPF ou e-mail. Se ainda não escolheu uma casa, busque no diretório e envie uma solicitação."
            acao={<div className="flex flex-wrap justify-center gap-2"><LinkButton href="/casas-de-repouso">Buscar casas de repouso</LinkButton><LinkButton href="/cliente/solicitacoes" variante="contorno">Fazer uma solicitação</LinkButton></div>}
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {familiares.map((f) => (
              <li key={f.id}>
                <Link href={`/cliente/residentes/${f.residente.id}`} className="block rounded-xl border border-line bg-surface p-5 shadow-sm hover:shadow-md">
                  <p className="text-lg font-semibold">{f.residente.nome_completo}</p>
                  <p className="text-sm text-muted">{calcularIdade(f.residente.data_nascimento)} anos · {f.parentesco}</p>
                  <p className="mt-2 text-sm">{f.residente.ilpi?.nome_fantasia} · {f.residente.ilpi?.cidade}/{f.residente.ilpi?.uf}</p>
                  <div className="mt-3"><Indicadores indicador={ind[f.residente.id]} /></div>
                  <p className="mt-3 text-sm font-semibold text-accent">Ver linha do tempo</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recentes.itens.length > 0 && (
        <section className="mt-8" aria-labelledby="ultimas">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="ultimas" className="text-xl font-bold">Últimas atualizações</h2>
            <Link href="/cliente/residentes" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">Ver todas</Link>
          </div>
          <RegistrosLista itens={recentes.itens} mostrarResidente />
        </section>
      )}

      <Card className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><MessageSquare aria-hidden className="size-6 text-accent" /><p className="font-semibold">Quer falar com a equipe da casa de repouso?</p></div>
        <LinkButton href="/cliente/chat" variante="contorno">Abrir o chat</LinkButton>
      </Card>
    </>
  );
}
