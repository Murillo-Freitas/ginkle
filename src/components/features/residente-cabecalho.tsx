import { Droplet, Home, MapPin, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/feedback';
import { Card } from '@/components/ui/card';
import { calcularIdade, formatarData } from '@/utils/formatters';
import { Indicadores } from './semaforo';
import type { IndicadorDia } from '@/lib/indicadores';
import type { ReactNode } from 'react';
import type { Residente } from '@/types';

export function ResidenteCabecalho({ r, casa, indicador, acoes }: {
  r: Residente; casa?: { nome_fantasia: string; cidade: string; uf: string } | null; indicador?: IndicadorDia; acoes?: ReactNode;
}) {
  const semAlergia = /^nenhuma/i.test(r.alergias.trim());
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{r.nome_completo}</h1>
          <p className="mt-1 text-muted">
            {calcularIdade(r.data_nascimento)} anos · nascimento em {formatarData(r.data_nascimento)}
          </p>
        </div>
        <Badge tom={r.status === 'ATIVO' ? 'ok' : 'neutro'}>{r.status === 'ATIVO' ? 'Residente ativo' : 'Inativo'}</Badge>
      </div>
      {indicador && <div className="mt-4"><Indicadores indicador={indicador} /></div>}
      {acoes && <div className="mt-4 flex flex-wrap gap-2">{acoes}</div>}
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {casa && (
          <div>
            <dt className="flex items-center gap-1.5 text-sm font-semibold text-muted"><MapPin aria-hidden className="size-4" />Casa de repouso</dt>
            <dd className="mt-0.5">{casa.nome_fantasia} · {casa.cidade}/{casa.uf}</dd>
          </div>
        )}
        <div>
          <dt className="flex items-center gap-1.5 text-sm font-semibold text-muted"><Home aria-hidden className="size-4" />Quarto</dt>
          <dd className="mt-0.5">{r.quarto ?? 'Não informado'}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-sm font-semibold text-muted"><Droplet aria-hidden className="size-4" />Tipo sanguíneo</dt>
          <dd className="mt-0.5">{r.tipo_sanguineo === 'DESCONHECIDO' ? 'Não informado' : r.tipo_sanguineo}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-sm font-semibold text-muted"><ShieldAlert aria-hidden className="size-4" />Alergias</dt>
          <dd className="mt-0.5">{semAlergia ? r.alergias : <Badge tom="aviso">{r.alergias}</Badge>}</dd>
        </div>
      </dl>
      {r.observacoes_medicas && (
        <div className="mt-5 rounded-lg bg-surface-alt p-4">
          <p className="text-sm font-semibold text-muted">Observações médicas</p>
          <p className="mt-1 whitespace-pre-line">{r.observacoes_medicas}</p>
        </div>
      )}
    </Card>
  );
}
