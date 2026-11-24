import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, ClipboardList, TriangleAlert, UsersRound } from 'lucide-react';
import { RegistrosLista } from '@/components/features/registro-item';
import { SemCasaEquipe } from '@/components/features/sem-casa';
import { LinkButton } from '@/components/ui/button';
import { Card, PageHeader, Stat } from '@/components/ui/card';
import { Badge } from '@/components/ui/feedback';
import { exigirSessao, getCasaEquipe } from '@/lib/auth';
import { contar } from '@/lib/dados';
import { buscarRegistros, inicioDeHoje, inicioDoPeriodo } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { TURNOS } from '@/utils/constants';
import { formatarData, hojeISO } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Meu turno' };

export default async function FuncionarioDashboard() {
  const sessao = await exigirSessao();
  const vinculo = await getCasaEquipe();
  if (!vinculo) return <><PageHeader titulo="Meu turno" /><SemCasaEquipe /></>;

  const supabase = await createClient();
  const casaId = vinculo.casa.id;
  const hoje = hojeISO();

  const [{ data: escalaData }, residentes, meusHoje, urgentes, recentes] = await Promise.all([
    supabase.from('escalas').select('id, data, turno, observacao').eq('usuario_id', sessao.id).gte('data', hoje).order('data').limit(4),
    contar(supabase, 'residentes', { ilpi_id: casaId, status: 'ATIVO' }),
    contar(supabase, 'registros_assistenciais', { ilpi_id: casaId, autor_id: sessao.id }, { coluna: 'criado_em_dispositivo', valor: inicioDeHoje() }),
    contar(supabase, 'registros_assistenciais', { ilpi_id: casaId, urgente: true }, { coluna: 'criado_em_dispositivo', valor: inicioDoPeriodo('7d')! }),
    buscarRegistros(supabase, { ilpiId: casaId, periodo: 'hoje', limite: 5 }),
  ]);
  const escala = (escalaData ?? []) as { id: string; data: string; turno: string; observacao: string | null }[];
  const turnoHoje = escala.find((e) => e.data === hoje);

  return (
    <>
      <PageHeader titulo={`Olá, ${sessao.nome.split(' ')[0]}`} descricao={`${vinculo.casa.nome_fantasia} · ${vinculo.casa.cidade}/${vinculo.casa.uf}`} />

      <Card className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays aria-hidden className="size-6 text-accent" />
          <div>
            <p className="font-semibold">{turnoHoje ? `Hoje: turno da ${TURNOS[turnoHoje.turno].toLowerCase()}` : 'Você não está escalado para hoje'}</p>
            {turnoHoje?.observacao && <p className="text-sm text-muted">{turnoHoje.observacao}</p>}
            {!turnoHoje && escala[0] && <p className="text-sm text-muted">Próximo turno: {formatarData(escala[0].data)} ({TURNOS[escala[0].turno]})</p>}
          </div>
        </div>
        <Link href="/funcionario/escala" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">Ver minha escala</Link>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat rotulo="Residentes ativos" valor={residentes} icone={<UsersRound className="size-5" />} />
        <Stat rotulo="Meus registros hoje" valor={meusHoje} icone={<ClipboardList className="size-5" />} />
        <Stat rotulo="Ocorrências urgentes (7 dias)" valor={urgentes} icone={<TriangleAlert className="size-5" />} />
      </div>

      <section className="mt-8" aria-labelledby="atalhos">
        <h2 id="atalhos" className="mb-3 text-xl font-bold">Registrar agora</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <LinkButton href="/funcionario/cuidados" variante="contorno" tamanho="lg">Cuidado</LinkButton>
          <LinkButton href="/funcionario/medicamentos" variante="contorno" tamanho="lg">Medicação</LinkButton>
          <LinkButton href="/funcionario/sinais-vitais" variante="contorno" tamanho="lg">Sinais vitais</LinkButton>
          <LinkButton href="/funcionario/ocorrencias" variante="contorno" tamanho="lg">Ocorrência</LinkButton>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="hoje">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="hoje" className="text-xl font-bold">Registros de hoje na casa <Badge>{recentes.total}</Badge></h2>
          <Link href="/funcionario/historico" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">Ver histórico</Link>
        </div>
        {recentes.itens.length === 0 ? <p className="text-muted">Nenhum registro hoje até agora.</p> : <RegistrosLista itens={recentes.itens} mostrarResidente />}
      </section>
    </>
  );
}
