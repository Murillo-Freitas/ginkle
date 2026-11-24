import { Clock, Coffee, Dumbbell, Pill, Users, Utensils, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/feedback';
import { cn } from '@/lib/cn';
import { CATEGORIAS_ATIVIDADE, DIAS_SEMANA, ORDEM_SEMANA } from '@/utils/constants';
import { horaCurta } from '@/utils/formatters';

export interface AtividadeLinha {
  id: string; titulo: string; descricao: string | null; categoria: string; dia_semana: number;
  hora_inicio: string; hora_fim: string | null; local: string | null; ativa: boolean;
}

export const ICONE_CATEGORIA: Record<string, LucideIcon> = {
  FISICA: Dumbbell, SOCIAL: Users, ALIMENTACAO: Utensils, MEDICACAO: Pill, ROTINA: Clock,
};

export function IconeCategoria({ categoria, className }: { categoria: string; className?: string }) {
  const Icone = ICONE_CATEGORIA[categoria] ?? Coffee;
  return <Icone aria-hidden className={className ?? 'size-4'} />;
}

/** Calendário semanal (segunda a domingo). Em telas pequenas, os dias ficam empilhados. */
export function CronogramaSemana({ atividades, hoje, acoes }: {
  atividades: AtividadeLinha[]; hoje?: number; acoes?: (a: AtividadeLinha) => ReactNode;
}) {
  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="Legenda">
        {Object.entries(CATEGORIAS_ATIVIDADE).map(([k, r]) => (
          <li key={k} className="inline-flex items-center gap-1.5"><IconeCategoria categoria={k} /> {r}</li>
        ))}
      </ul>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {ORDEM_SEMANA.map((dia) => {
          const doDia = atividades.filter((a) => a.dia_semana === dia).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
          const ehHoje = hoje === dia;
          return (
            <section key={dia} aria-labelledby={`dia-${dia}`} className={cn('rounded-xl border bg-surface p-3', ehHoje ? 'border-primary' : 'border-line')}>
              <h3 id={`dia-${dia}`} className="mb-2 flex items-center justify-between gap-2 text-base font-bold">
                {DIAS_SEMANA[dia]}
                {ehHoje && <Badge tom="marca">Hoje</Badge>}
              </h3>
              {doDia.length === 0 ? (
                <p className="text-sm text-muted">Sem atividades.</p>
              ) : (
                <ul className="space-y-2">
                  {doDia.map((a) => (
                    <li key={a.id} className={cn('rounded-lg bg-surface-alt p-2.5 text-sm', !a.ativa && 'opacity-60')}>
                      <p className="font-semibold">{horaCurta(a.hora_inicio)}{a.hora_fim ? ` – ${horaCurta(a.hora_fim)}` : ''}</p>
                      <p className="mt-0.5 flex items-start gap-1.5">
                        <IconeCategoria categoria={a.categoria} className="mt-0.5 size-4 shrink-0 text-accent" />
                        <span>{a.titulo}</span>
                      </p>
                      {a.local && <p className="text-muted">{a.local}</p>}
                      {a.descricao && <p className="mt-1 text-muted">{a.descricao}</p>}
                      {!a.ativa && <Badge className="mt-1">Pausada</Badge>}
                      {acoes && <div className="mt-2 flex flex-wrap gap-2">{acoes(a)}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
