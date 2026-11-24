import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/feedback';
import { ROTULO_NIVEL } from '@/utils/constants';
import type { IndicadorDia, Nivel } from '@/lib/indicadores';

const CONFIG = {
  BEM: { tom: 'ok', Icone: CheckCircle2 },
  ATENCAO: { tom: 'aviso', Icone: AlertTriangle },
  ALERTA: { tom: 'perigo', Icone: AlertCircle },
} as const;

/** Indicador verde/amarelo/vermelho. Sempre acompanhado de ícone e texto (não depende só da cor). */
export function Semaforo({ rotulo, nivel }: { rotulo: string; nivel: Nivel | null }) {
  if (!nivel) return <span className="text-sm text-muted">{rotulo}: sem registro hoje</span>;
  const { tom, Icone } = CONFIG[nivel];
  return (
    <Badge tom={tom} className="px-3 py-1 text-sm">
      <Icone aria-hidden className="size-4" /> {rotulo}: {ROTULO_NIVEL[nivel]}
    </Badge>
  );
}

export function Indicadores({ indicador }: { indicador?: IndicadorDia }) {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Indicadores de hoje">
      <Semaforo rotulo="Humor" nivel={indicador?.humor ?? null} />
      <Semaforo rotulo="Saúde" nivel={indicador?.estado ?? null} />
    </div>
  );
}
