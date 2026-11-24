import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarX } from 'lucide-react';
import { AtualizarAoVivo } from '@/components/features/atualizar-ao-vivo';
import { CronogramaSemana, IconeCategoria, type AtividadeLinha } from '@/components/features/cronograma-semana';
import { LinkButton } from '@/components/ui/button';
import { Card, PageHeader } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { exigirSessao } from '@/lib/auth';
import { listarFamiliares } from '@/lib/dados';
import { primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/cn';
import { DIAS_SEMANA, SITUACOES_PRESENCA } from '@/utils/constants';
import { diaDaSemana, horaCurta, hojeISO } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Cronograma' };

export default async function CronogramaFamiliar({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sessao = await exigirSessao();
  const supabase = await createClient();
  const familiares = await listarFamiliares(supabase, sessao.id);

  const casas = new Map<string, string>();
  for (const f of familiares) if (f.residente.ilpi) casas.set(f.residente.ilpi.id, f.residente.ilpi.nome_fantasia);

  if (casas.size === 0) {
    return (
      <>
        <PageHeader titulo="Cronograma" descricao="Atividades e rotina planejadas para a semana na casa de repouso." />
        <EmptyState icone={<CalendarX className="size-10" />} titulo="Nenhum cronograma para mostrar" descricao="Quando você tiver um familiar vinculado a uma casa de repouso, o cronograma semanal dela aparece aqui." acao={<LinkButton href="/casas-de-repouso">Buscar casas de repouso</LinkButton>} />
      </>
    );
  }

  const param = primeiro((await searchParams).casa);
  const casaId = casas.has(param) ? param : [...casas.keys()][0];
  const hoje = hojeISO();
  const dia = diaDaSemana(hoje);
  const meus = familiares.filter((f) => f.residente.ilpi?.id === casaId);

  const [{ data: atv }, { data: reg }] = await Promise.all([
    supabase.from('atividades').select('id, titulo, descricao, categoria, dia_semana, hora_inicio, hora_fim, local, ativa').eq('ilpi_id', casaId).eq('ativa', true).order('hora_inicio'),
    supabase.from('atividade_registros').select('atividade_id, residente_id, situacao').in('residente_id', meus.map((m) => m.residente.id)).eq('data', hoje),
  ]);
  const atividades = (atv ?? []) as unknown as AtividadeLinha[];
  const registros = (reg ?? []) as { atividade_id: string; residente_id: string; situacao: string }[];
  const doDia = atividades.filter((a) => a.dia_semana === dia);

  return (
    <>
      <AtualizarAoVivo tabelas={['atividades', 'atividade_registros']} />
      <PageHeader titulo="Cronograma" descricao="Atividades físicas, sociais e a rotina planejadas para a semana. Atualiza sozinho quando a casa faz alterações." />

      {casas.size > 1 && (
        <nav aria-label="Casas de repouso" className="mb-4 flex flex-wrap gap-2">
          {[...casas.entries()].map(([id, nome]) => (
            <Link key={id} href={`/cliente/cronograma?casa=${id}`} aria-current={id === casaId ? 'true' : undefined}
              className={cn('inline-flex min-h-11 items-center rounded-lg border px-4 font-semibold', id === casaId ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface hover:bg-surface-alt')}>
              {nome}
            </Link>
          ))}
        </nav>
      )}

      <Card className="mb-6">
        <h2 className="text-xl font-bold">Hoje, {DIAS_SEMANA[dia].toLowerCase()}</h2>
        {doDia.length === 0 ? (
          <p className="mt-2 text-muted">Não há atividades cadastradas para hoje.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {doDia.map((a) => (
              <li key={a.id}>
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <IconeCategoria categoria={a.categoria} className="size-5 text-accent" />
                  {horaCurta(a.hora_inicio)} · {a.titulo}
                </p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {meus.map((m) => {
                    const x = registros.find((r) => r.atividade_id === a.id && r.residente_id === m.residente.id);
                    return (
                      <li key={m.id}>
                        <Badge tom={x ? (x.situacao === 'PARTICIPOU' ? 'ok' : 'aviso') : 'neutro'}>
                          {m.residente.nome_completo.split(' ')[0]}: {x ? SITUACOES_PRESENCA[x.situacao] : 'ainda não registrado'}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <h2 className="mb-3 text-2xl font-bold">Semana</h2>
      <CronogramaSemana atividades={atividades} hoje={dia} />
    </>
  );
}
