import type { Metadata } from 'next';
import { BotaoAcao } from '@/components/features/botao-acao';
import { Card, PageHeader } from '@/components/ui/card';
import { Alert, Badge } from '@/components/ui/feedback';
import { exigirCasaGestor } from '@/lib/auth';
import { contar } from '@/lib/dados';
import { createClient } from '@/lib/supabase/server';
import { formatarMoeda } from '@/utils/formatters';
import type { Plano } from '@/types';

export const metadata: Metadata = { title: 'Planos' };

export default async function PlanosPage() {
  const { casa } = await exigirCasaGestor();
  const supabase = await createClient();
  const [{ data: p }, { data: a }, ativos] = await Promise.all([
    supabase.from('planos').select('id, codigo, nome, descricao, valor_mensal, max_residentes').order('valor_mensal'),
    supabase.from('assinaturas').select('plano:planos(codigo)').eq('ilpi_id', casa.id).eq('status', 'ATIVA').maybeSingle(),
    contar(supabase, 'residentes', { ilpi_id: casa.id, status: 'ATIVO' }),
  ]);
  const planos = (p ?? []) as unknown as Plano[];
  const atual = (a as unknown as { plano: { codigo: string } } | null)?.plano.codigo;

  return (
    <>
      <PageHeader titulo="Planos" descricao={`Plano da casa ${casa.nome_fantasia}. Hoje há ${ativos} residente(s) ativo(s).`} />
      <div className="mb-6"><Alert tipo="info" titulo="Ambiente de demonstração">A troca de plano é registrada no sistema, mas nenhuma cobrança real é realizada (não há gateway de pagamento).</Alert></div>
      <div className="grid gap-6 md:grid-cols-2">
        {planos.map((pl) => {
          const ehAtual = pl.codigo === atual;
          return (
            <Card key={pl.id} className={ehAtual ? 'border-primary' : ''}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold">{pl.nome}</h2>
                {ehAtual && <Badge tom="marca">Plano atual</Badge>}
              </div>
              <p className="mt-2 font-display text-3xl font-bold">{formatarMoeda(Number(pl.valor_mensal))}<span className="text-base font-normal text-muted"> /mês</span></p>
              <p className="mt-2 text-muted">{pl.descricao}</p>
              <ul className="mt-4 list-disc space-y-1 pl-5">
                <li>{pl.max_residentes ? `Até ${pl.max_residentes} residentes ativos` : 'Residentes ilimitados'}</li>
                <li>Equipe, escala e chat com as famílias</li>
                <li>Histórico de ações para auditoria</li>
              </ul>
              {!ehAtual && (
                <div className="mt-5">
                  <BotaoAcao rotulo={`Mudar para ${pl.nome}`} variante="primario" tamanho="md"
                    acao={{ tipo: 'rpc', nome: 'alterar_plano', args: { p_ilpi: casa.id, p_codigo: pl.codigo } }}
                    confirmar={`Mudar o plano da casa para ${pl.nome}?`} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
