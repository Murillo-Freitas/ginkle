import type { Metadata } from 'next';
import { CalendarX } from 'lucide-react';
import { CronogramaSemana, IconeCategoria, type AtividadeLinha } from '@/components/features/cronograma-semana';
import { PresencaAtividade, type LinhaPresenca } from '@/components/features/presenca-atividade';
import { SemCasaEquipe } from '@/components/features/sem-casa';
import { classesBotao } from '@/components/ui/button';
import { Card, PageHeader } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { estiloCampo, estiloRotulo } from '@/components/ui/estilos';
import { exigirSessao, getCasaEquipe } from '@/lib/auth';
import { listarResidentesCasa } from '@/lib/dados';
import { primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIAS_ATIVIDADE, DIAS_SEMANA } from '@/utils/constants';
import { diaDaSemana, formatarData, horaCurta, hojeISO } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Atividades do dia' };

export default async function AtividadesEquipe({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await exigirSessao();
  const vinculo = await getCasaEquipe();
  if (!vinculo) return <><PageHeader titulo="Atividades do dia" /><SemCasaEquipe /></>;

  const param = primeiro((await searchParams).data);
  const data = /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : hojeISO();
  const dia = diaDaSemana(data);
  const supabase = await createClient();
  const casaId = vinculo.casa.id;

  const [{ data: atv }, { data: reg }, residentes] = await Promise.all([
    supabase.from('atividades').select('id, titulo, descricao, categoria, dia_semana, hora_inicio, hora_fim, local, ativa').eq('ilpi_id', casaId).eq('ativa', true).order('hora_inicio'),
    supabase.from('atividade_registros').select('id, atividade_id, residente_id, situacao').eq('ilpi_id', casaId).eq('data', data),
    listarResidentesCasa(supabase, casaId, { status: 'ATIVO' }),
  ]);
  const todas = (atv ?? []) as unknown as AtividadeLinha[];
  const doDia = todas.filter((a) => a.dia_semana === dia);
  const registros = (reg ?? []) as { id: string; atividade_id: string; residente_id: string; situacao: string }[];

  return (
    <>
      <PageHeader titulo="Atividades do dia" descricao={`${DIAS_SEMANA[dia]}, ${formatarData(data)}. Marque quem participou de cada atividade.`} />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div><label htmlFor="data" className={estiloRotulo}>Data</label><input id="data" name="data" type="date" defaultValue={data} className={estiloCampo} /></div>
        <button type="submit" className={classesBotao('primario', 'md')}>Ver dia</button>
      </form>

      {doDia.length === 0 ? (
        <EmptyState icone={<CalendarX className="size-10" />} titulo="Nenhuma atividade neste dia da semana" descricao="O gestor cadastra o cronograma em Atividades. Escolha outra data ou peça para incluir as atividades." />
      ) : (
        <div className="space-y-5">
          {doDia.map((a) => {
            const linhas: LinhaPresenca[] = residentes.map((r) => {
              const x = registros.find((y) => y.atividade_id === a.id && y.residente_id === r.id);
              return { residenteId: r.id, nome: r.nome_completo, registroId: x?.id ?? null, situacao: x?.situacao ?? null };
            });
            return (
              <Card key={a.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-lg font-bold"><IconeCategoria categoria={a.categoria} className="size-5 text-accent" /> {a.titulo}</h2>
                  <Badge>{horaCurta(a.hora_inicio)}{a.hora_fim ? ` – ${horaCurta(a.hora_fim)}` : ''} · {CATEGORIAS_ATIVIDADE[a.categoria]}</Badge>
                </div>
                {a.local && <p className="text-sm text-muted">{a.local}</p>}
                <div className="mt-3">
                  {residentes.length === 0 ? <p className="text-muted">Não há residentes ativos.</p> : <PresencaAtividade key={`${a.id}-${data}`} atividadeId={a.id} data={data} linhas={linhas} />}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <details className="mt-8 rounded-xl border border-line bg-surface p-4">
        <summary className="cursor-pointer text-lg font-bold">Ver a semana completa</summary>
        <div className="mt-4"><CronogramaSemana atividades={todas} hoje={dia} /></div>
      </details>
    </>
  );
}
