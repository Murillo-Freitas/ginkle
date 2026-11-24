import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Globe, Mail, MapPin, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSessao } from '@/lib/auth';
import { COLUNAS_CASA } from '@/lib/casas';
import { LinkButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, Estrelas } from '@/components/ui/feedback';
import { enderecoEmLinha, formatarCEP, formatarDataHora, formatarTelefone } from '@/utils/formatters';
import { ehUUID } from '@/utils/validators';
import type { Casa } from '@/types';

type Params = Promise<{ id: string }>;

async function carregar(id: string) {
  if (!ehUUID(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('ilpis').select(COLUNAS_CASA).eq('id', id).maybeSingle();
  return { supabase, casa: data as unknown as Casa | null };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const r = await carregar(id);
  return { title: r?.casa?.nome_fantasia ?? 'Casa de repouso' };
}

export default async function CasaDetalhe({ params }: { params: Params }) {
  const { id } = await params;
  const r = await carregar(id);
  if (!r?.casa) notFound();
  const { supabase, casa } = r;
  const sessao = await getSessao();

  const [{ data: resumo }, { data: avaliacoes }] = await Promise.all([
    supabase.from('casas_avaliacao').select('nota_media, total').eq('ilpi_id', id).maybeSingle(),
    supabase.from('avaliacoes_publicas').select('id, nota, comentario, data_avaliacao, autor').eq('ilpi_id', id).order('data_avaliacao', { ascending: false }).limit(10),
  ]);
  const nota = resumo as { nota_media: number; total: number } | null;
  const lista = (avaliacoes ?? []) as { id: string; nota: number; comentario: string | null; data_avaliacao: string; autor: string }[];
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${enderecoEmLinha(casa)}, ${formatarCEP(casa.cep)}`)}`;
  const contato = 'inline-flex min-h-11 items-center gap-2 font-medium text-accent underline-offset-4 hover:underline';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav aria-label="Você está em" className="mb-4 text-sm text-muted">
        <Link href="/casas-de-repouso" className="hover:underline">Casas de repouso</Link> / <span>{casa.nome_fantasia}</span>
      </nav>

      <div className="relative aspect-[16/7] overflow-hidden rounded-xl bg-surface-alt">
        {casa.capa_url ? (
          <Image src={casa.capa_url} alt={`Foto da ${casa.nome_fantasia}`} fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image src="/brand/marca-claro.svg" alt="" width={96} height={96} />
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold">{casa.nome_fantasia}</h1>
            {casa.verificada && <Badge tom="ok">Verificada</Badge>}
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-muted"><MapPin aria-hidden className="mt-1 size-4 shrink-0" />{enderecoEmLinha(casa)} · CEP {formatarCEP(casa.cep)}</p>
          <div className="mt-2">{nota ? <Estrelas nota={Number(nota.nota_media)} total={nota.total} /> : <span className="text-sm text-muted">Ainda sem avaliações</span>}</div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          {sessao ? (
            <>
              <LinkButton href={`/cliente/solicitacoes?casa=${casa.id}`}>Solicitar entrada ou acesso</LinkButton>
              <LinkButton href={`/cliente/chat?casa=${casa.id}`} variante="contorno">Conversar com a casa</LinkButton>
            </>
          ) : (
            <LinkButton href="/cadastro">Criar conta para solicitar</LinkButton>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="text-xl font-bold">Sobre a casa</h2>
          <p className="mt-3 whitespace-pre-line">{casa.descricao ?? 'A casa de repouso ainda não adicionou uma descrição.'}</p>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Contato</h2>
          <ul className="mt-3 space-y-1">
            {casa.telefone && <li><a className={contato} href={`tel:${casa.telefone}`}><Phone aria-hidden className="size-4" />{formatarTelefone(casa.telefone)}</a></li>}
            {casa.email && <li><a className={`${contato} break-all`} href={`mailto:${casa.email}`}><Mail aria-hidden className="size-4 shrink-0" />{casa.email}</a></li>}
            {casa.site && <li><a className={`${contato} break-all`} href={casa.site} target="_blank" rel="noopener noreferrer"><Globe aria-hidden className="size-4 shrink-0" />Site da casa</a></li>}
            <li><a className={contato} href={mapa} target="_blank" rel="noopener noreferrer"><MapPin aria-hidden className="size-4" />Ver no mapa</a></li>
          </ul>
        </Card>
      </div>

      {casa.latitude != null && casa.longitude != null && (
        <section className="mt-8" aria-labelledby="mapa">
          <h2 id="mapa" className="mb-3 text-2xl font-bold">Localização</h2>
          <iframe
            title={`Mapa com a localização de ${casa.nome_fantasia}`}
            loading="lazy"
            className="h-72 w-full rounded-xl border border-line"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${casa.longitude - 0.006}%2C${casa.latitude - 0.004}%2C${casa.longitude + 0.006}%2C${casa.latitude + 0.004}&layer=mapnik&marker=${casa.latitude}%2C${casa.longitude}`}
          />
          <p className="mt-2 text-sm text-muted">Mapa © colaboradores do OpenStreetMap.</p>
        </section>
      )}

      <section className="mt-8" aria-labelledby="avaliacoes">
        <h2 id="avaliacoes" className="text-2xl font-bold">Avaliações das famílias</h2>
        {lista.length === 0 ? (
          <p className="mt-3 text-muted">Ainda não há avaliações. Somente familiares de residentes da casa podem avaliar.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {lista.map((a) => (
              <li key={a.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Estrelas nota={a.nota} />
                  <span className="text-sm text-muted">{a.autor} · {formatarDataHora(a.data_avaliacao).slice(0, 10)}</span>
                </div>
                {a.comentario && <p className="mt-2 whitespace-pre-line">{a.comentario}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
