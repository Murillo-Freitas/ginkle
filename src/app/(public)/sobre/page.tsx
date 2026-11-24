import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Sobre nós' };

export default function SobrePage() {
  const h2 = 'mt-10 text-2xl font-bold';
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader titulo="Sobre o Ginkle" descricao="Um sistema de gestão para casas de repouso, pensado para aproximar famílias e quem cuida." />

      <h2 className={h2}>O problema</h2>
      <p className="mt-3">
        A população idosa brasileira cresce a cada ano e, com ela, a procura por casas de repouso. A falta de registros rastreáveis e de canais claros de comunicação deixa as famílias inseguras e dificulta a gestão das instituições.
      </p>

      <h2 className={h2}>Nossa proposta</h2>
      <p className="mt-3">
        O Ginkle centraliza os dados dos residentes, registra os cuidados prestados e dá às famílias acesso controlado às informações atualizadas. Para as casas de repouso, organiza equipe, escala, solicitações, mensalidades e um histórico de ações para auditoria.
      </p>

      <h2 className={h2}>O símbolo</h2>
      <p className="mt-3">
        A folha de ginkgo biloba representa resistência, resiliência e longevidade. O nome é uma releitura da natureza em uma identidade moderna e digital.
      </p>

      <h2 className={h2}>Objetivos de Desenvolvimento Sustentável</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li><strong>ODS 3, Saúde e bem-estar:</strong> cuidado humanizado, monitorado por dados precisos.</li>
        <li><strong>ODS 10, Redução das desigualdades:</strong> acesso claro e igualitário à informação para as famílias.</li>
        <li><strong>ODS 16, Paz, justiça e instituições eficazes:</strong> responsabilidade, rastreabilidade e confiança mútua.</li>
      </ul>

      <h2 className={h2}>Quem somos</h2>
      <p className="mt-3">
        O Ginkle é um Trabalho de Conclusão de Curso desenvolvido pela equipe Viventi, no curso Técnico em Desenvolvimento de Sistemas da ETEC de Praia Grande (Centro Paula Souza).
      </p>
    </div>
  );
}
