import Image from 'next/image';
import { ClipboardCheck, FileSearch, Lock, MessageSquare, ShieldCheck, Smartphone } from 'lucide-react';
import { LinkButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getSessao } from '@/lib/auth';
import { DASHBOARD_POR_PERFIL } from '@/utils/constants';

export default async function Home() {
  const sessao = await getSessao();

  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-950 text-white">
        <Image src="/images/hero.webp" alt="" fill priority sizes="100vw" className="-z-10 object-cover object-[70%_center]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/95 via-brand-950/75 to-brand-950/30 md:via-brand-950/60" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl lg:text-6xl">O cuidado de portas abertas</h1>
          <p className="mt-5 max-w-xl text-lg text-brand-100 sm:text-xl">
            Rotina, medicação e ocorrências registradas por quem cuida, e visíveis para quem ama. O Ginkle transforma o dia a dia da casa de repouso em um histórico claro, com hora e responsável.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {sessao ? (
              <LinkButton href={DASHBOARD_POR_PERFIL[sessao.perfilAtivo]} tamanho="lg" className="!bg-brand-300 !text-brand-950 hover:!bg-brand-200">Ir para o meu painel</LinkButton>
            ) : (
              <LinkButton href="/cadastro" tamanho="lg" className="!bg-brand-300 !text-brand-950 hover:!bg-brand-200">Criar conta de familiar</LinkButton>
            )}
            <LinkButton href="/casas-de-repouso" variante="contorno" tamanho="lg" className="!border-brand-300 !bg-transparent !text-white hover:!bg-white/10">
              Buscar casas de repouso
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="para-quem">
        <h2 id="para-quem" className="text-3xl font-bold">Para quem é o Ginkle</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden !p-0">
            <div className="relative aspect-[16/9]">
              <Image src="/images/familias.webp" alt="Família reunida sorrindo" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold">Famílias</h3>
              <ul className="mt-3 space-y-2 text-base">
                <li>Encontre casas de repouso por cidade e CEP, com avaliações de outras famílias.</li>
                <li>Acompanhe a linha do tempo do seu familiar: cuidados, medicação, sinais vitais e ocorrências.</li>
                <li>Converse com a casa pelo chat e veja os custos mensais com clareza.</li>
              </ul>
              <div className="mt-5"><LinkButton href="/cadastro">Criar conta</LinkButton></div>
            </div>
          </Card>
          <Card className="flex flex-col">
            <h3 className="text-xl font-bold">Casas de repouso</h3>
            <ul className="mt-3 space-y-2 text-base">
              <li>Centralize os dados dos residentes e registre os cuidados prestados em cada turno.</li>
              <li>Organize equipe, escala, solicitações de famílias e mensalidades em um só lugar.</li>
              <li>Tenha um histórico de ações com data, hora e responsável, pronto para auditoria.</li>
              <li>Mostre transparência: casas bem avaliadas passam mais confiança.</li>
            </ul>
            <div className="mt-auto pt-6"><LinkButton href="/cadastrar-casa" variante="contorno">Cadastrar minha casa de repouso</LinkButton></div>
          </Card>
        </div>
      </section>

      <section className="bg-surface-alt" aria-labelledby="como-funciona">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 id="como-funciona" className="text-3xl font-bold">Como funciona</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { icone: ClipboardCheck, t: '1. A equipe registra', d: 'Cuidadores e enfermeiros lançam cuidados, medicamentos, sinais vitais e ocorrências durante o turno.' },
              { icone: Smartphone, t: '2. A família acompanha', d: 'Familiares vinculados veem o histórico do seu ente querido no celular ou no computador.' },
              { icone: FileSearch, t: '3. A gestão audita', d: 'Cada ação fica registrada com data, hora e autor. Nada é apagado.' },
            ].map(({ icone: Icone, t, d }) => (
              <li key={t} className="rounded-xl border border-line bg-surface p-6">
                <Icone aria-hidden className="size-8 text-accent" />
                <h3 className="mt-4 text-lg font-bold">{t}</h3>
                <p className="mt-2 text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="compromissos">
        <h2 id="compromissos" className="text-3xl font-bold">Nossos compromissos</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { icone: Lock, t: 'Privacidade', d: 'Cada pessoa vê somente o que seu perfil permite. A família enxerga apenas os seus familiares.' },
            { icone: ShieldCheck, t: 'Rastreabilidade', d: 'Registros de cuidado não podem ser editados ou apagados, e as ações da casa ficam em um histórico.' },
            { icone: MessageSquare, t: 'Comunicação', d: 'Chat direto entre a família e a casa de repouso, com histórico preservado.' },
          ].map(({ icone: Icone, t, d }) => (
            <div key={t} className="flex gap-4">
              <Icone aria-hidden className="mt-1 size-7 shrink-0 text-accent" />
              <div>
                <h3 className="text-lg font-bold">{t}</h3>
                <p className="mt-1 text-muted">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
