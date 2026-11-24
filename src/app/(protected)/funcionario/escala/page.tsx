import type { Metadata } from 'next';
import { CalendarX } from 'lucide-react';
import { PageHeader } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { exigirSessao } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { FUSO, TURNOS } from '@/utils/constants';
import { hojeISO } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Minha escala' };

export default async function EscalaPage() {
  const sessao = await exigirSessao();
  const hoje = hojeISO();
  const fim = new Date(Date.now() + 45 * 86_400_000).toLocaleDateString('en-CA', { timeZone: FUSO });
  const { data } = await (await createClient())
    .from('escalas')
    .select('id, data, turno, observacao, ilpi:ilpis(nome_fantasia)')
    .eq('usuario_id', sessao.id)
    .gte('data', hoje)
    .lte('data', fim)
    .order('data');
  const lista = (data ?? []) as unknown as { id: string; data: string; turno: string; observacao: string | null; ilpi: { nome_fantasia: string } | null }[];
  const rotuloDia = (iso: string) =>
    new Date(`${iso}T12:00:00-03:00`).toLocaleDateString('pt-BR', { timeZone: FUSO, weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <>
      <PageHeader titulo="Minha escala" descricao="Seus próximos turnos nos próximos 45 dias. Dúvidas sobre a escala? Fale com o gestor." />
      {lista.length === 0 ? (
        <EmptyState icone={<CalendarX className="size-10" />} titulo="Nenhum turno escalado" descricao="Quando o gestor lançar a sua escala, os turnos aparecerão aqui." />
      ) : (
        <ul className="space-y-3">
          {lista.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 sm:p-5">
              <div>
                <p className="font-semibold capitalize">{rotuloDia(e.data)}</p>
                <p className="text-sm text-muted">{e.ilpi?.nome_fantasia}{e.observacao ? ` · ${e.observacao}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {e.data === hoje && <Badge tom="marca">Hoje</Badge>}
                <Badge>{TURNOS[e.turno]}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
