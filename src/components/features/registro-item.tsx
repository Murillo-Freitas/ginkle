import { AlertTriangle, HandHeart, HeartPulse, Pill, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/feedback';
import { cn } from '@/lib/cn';
import { SITUACOES_MEDICACAO, TIPOS_REGISTRO } from '@/utils/constants';
import { formatarDataHora } from '@/utils/formatters';
import type { DadosVitais, Registro, TipoRegistro } from '@/types';

const ICONES: Record<TipoRegistro, LucideIcon> = {
  CUIDADO: HandHeart,
  MEDICACAO: Pill,
  SINAIS_VITAIS: HeartPulse,
  OCORRENCIA: AlertTriangle,
};

export function chipsVitais(d: DadosVitais | null): string[] {
  if (!d) return [];
  const n = (v: number) => String(v).replace('.', ',');
  const lista: string[] = [];
  if (d.pa_sistolica && d.pa_diastolica) lista.push(`PA ${d.pa_sistolica}/${d.pa_diastolica} mmHg`);
  if (d.fc) lista.push(`FC ${d.fc} bpm`);
  if (d.temperatura) lista.push(`Temp. ${n(d.temperatura)} °C`);
  if (d.spo2) lista.push(`SpO₂ ${d.spo2}%`);
  if (d.glicemia) lista.push(`Glicemia ${d.glicemia} mg/dL`);
  if (d.peso) lista.push(`Peso ${n(d.peso)} kg`);
  return lista;
}

export function RegistroItem({ r, mostrarResidente }: { r: Registro; mostrarResidente?: boolean }) {
  const Icone = ICONES[r.tipo];
  const chips = r.tipo === 'SINAIS_VITAIS' ? chipsVitais(r.dados) : [];
  return (
    <li className={cn('rounded-xl border bg-surface p-4 sm:p-5', r.urgente ? 'border-danger/50' : 'border-line')}>
      <div className="flex items-start gap-3">
        <span aria-hidden className={cn('mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-lg', r.urgente ? 'bg-danger-bg text-danger' : 'bg-surface-alt text-accent')}>
          <Icone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{r.titulo}</h3>
            <Badge>{TIPOS_REGISTRO[r.tipo]}</Badge>
            {r.categoria && <Badge>{r.categoria}</Badge>}
            {r.urgente && <Badge tom="perigo">Urgente</Badge>}
            {r.situacao && <Badge tom={r.situacao === 'ADMINISTRADO' ? 'ok' : 'aviso'}>{SITUACOES_MEDICACAO[r.situacao]}</Badge>}
            {r.tipo === 'MEDICACAO' && (r.assinado ? <Badge tom="ok">Assinado</Badge> : <Badge tom="aviso">Sem assinatura</Badge>)}
          </div>
          {mostrarResidente && r.residente?.nome_completo && (
            <p className="mt-0.5 text-sm font-medium text-accent">{r.residente.nome_completo}</p>
          )}
          {chips.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {chips.map((c) => <li key={c} className="rounded-md bg-surface-alt px-2 py-1 text-sm font-medium">{c}</li>)}
            </ul>
          )}
          {r.tipo === 'MEDICACAO' && (r.dose || r.lote) && (
            <p className="mt-1 text-sm text-muted">
              {r.medicamento}{r.dose ? ` · ${r.dose}` : ''}{r.lote ? ` · Lote ${r.lote}` : ''}
            </p>
          )}
          <p className="mt-2 whitespace-pre-line text-base">{r.descricao}</p>
          <p className="mt-3 text-sm text-muted">
            {formatarDataHora(r.criado_em_dispositivo)} · Registrado por {r.autor_nome}{r.autor_cargo ? ` (${r.autor_cargo.toLowerCase()})` : ''}
          </p>
        </div>
      </div>
    </li>
  );
}

export function RegistrosLista({ itens, mostrarResidente }: { itens: Registro[]; mostrarResidente?: boolean }) {
  return (
    <ul className="space-y-3">
      {itens.map((r) => <RegistroItem key={r.id} r={r} mostrarResidente={mostrarResidente} />)}
    </ul>
  );
}
