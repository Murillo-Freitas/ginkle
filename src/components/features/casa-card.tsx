import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Badge, Estrelas } from '@/components/ui/feedback';
import { enderecoEmLinha } from '@/utils/formatters';
import type { Casa } from '@/types';

export function CasaCard({ casa, nota, distanciaKm }: { casa: Casa; nota?: { nota_media: number; total: number }; distanciaKm?: number }) {
  return (
    <li className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/casas-de-repouso/${casa.id}`} className="block">
        <div className="relative aspect-[16/9] bg-surface-alt">
          {casa.capa_url ? (
            <Image src={casa.capa_url} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Image src="/brand/marca-claro.svg" alt="" width={72} height={72} className="opacity-80" />
            </div>
          )}
        </div>
        <div className="space-y-2 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{casa.nome_fantasia}</h3>
            {casa.verificada && <Badge tom="ok">Verificada</Badge>}
          </div>
          <p className="flex items-start gap-1.5 text-sm text-muted">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>{enderecoEmLinha(casa)}</span>
          </p>
          {distanciaKm !== undefined && <p className="text-sm font-semibold text-accent">A {distanciaKm < 10 ? distanciaKm.toFixed(1).replace('.', ',') : Math.round(distanciaKm)} km de você</p>}
          {nota ? <Estrelas nota={nota.nota_media} total={nota.total} /> : <p className="text-sm text-muted">Ainda sem avaliações</p>}
          {casa.descricao && <p className="line-clamp-2 text-sm">{casa.descricao}</p>}
        </div>
      </Link>
    </li>
  );
}
