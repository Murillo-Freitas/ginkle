import type { Metadata } from 'next';
import { Star } from 'lucide-react';
import { ModalFormulario, type CampoConfig } from '@/components/features/formulario-generico';
import { PageHeader } from '@/components/ui/card';
import { EmptyState, Estrelas } from '@/components/ui/feedback';
import { LinkButton } from '@/components/ui/button';
import { exigirSessao } from '@/lib/auth';
import { listarFamiliares } from '@/lib/dados';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Avaliar casa' };

interface Avaliacao { id: string; ilpi_id: string; nota: number; comentario: string | null; anonimo: boolean }

export default async function AvaliarPage() {
  const sessao = await exigirSessao();
  const supabase = await createClient();
  const familiares = await listarFamiliares(supabase, sessao.id);

  const casas = new Map<string, { nome: string; local: string }>();
  for (const f of familiares) {
    const c = f.residente.ilpi;
    if (c) casas.set(c.id, { nome: c.nome_fantasia, local: `${c.cidade}/${c.uf}` });
  }
  const { data } = await supabase.from('avaliacoes').select('id, ilpi_id, nota, comentario, anonimo').eq('usuario_id', sessao.id);
  const minhas = new Map(((data ?? []) as Avaliacao[]).map((a) => [a.ilpi_id, a]));

  const campos = (a?: Avaliacao): CampoConfig[] => [
    {
      nome: 'nota', rotulo: 'Sua nota', tipo: 'select', obrigatorio: true, inicial: a ? String(a.nota) : '',
      opcoes: [5, 4, 3, 2, 1].map((n) => ({ valor: String(n), rotulo: `${n} ${n === 1 ? 'estrela' : 'estrelas'}${n === 5 ? ' · Excelente' : n === 1 ? ' · Ruim' : ''}` })),
    },
    { nome: 'comentario', rotulo: 'Comentário (opcional)', tipo: 'textarea', maxLen: 1000, inicial: a?.comentario ?? '', dica: 'Fale sobre atendimento, cuidado e comunicação. Evite dados pessoais de outras pessoas.' },
    { nome: 'anonimo', rotulo: 'Ocultar meu nome na avaliação pública', tipo: 'checkbox', inicial: a?.anonimo ?? false },
  ];

  return (
    <>
      <PageHeader titulo="Avaliar casa" descricao="Somente familiares de residentes podem avaliar a casa de repouso. Sua avaliação ajuda outras famílias." />
      {casas.size === 0 ? (
        <EmptyState icone={<Star className="size-10" />} titulo="Nada para avaliar ainda" descricao="Quando você tiver um familiar vinculado a uma casa de repouso, poderá avaliá-la aqui."
          acao={<LinkButton href="/casas-de-repouso">Buscar casas de repouso</LinkButton>} />
      ) : (
        <ul className="space-y-4">
          {[...casas.entries()].map(([id, c]) => {
            const a = minhas.get(id);
            return (
              <li key={id} className="rounded-xl border border-line bg-surface p-5">
                <p className="text-lg font-semibold">{c.nome}</p>
                <p className="text-sm text-muted">{c.local}</p>
                {a ? (
                  <div className="mt-3 space-y-2">
                    <Estrelas nota={a.nota} />
                    {a.comentario && <p className="whitespace-pre-line">{a.comentario}</p>}
                  </div>
                ) : <p className="mt-3 text-muted">Você ainda não avaliou esta casa.</p>}
                <div className="mt-4">
                  <ModalFormulario
                    rotuloBotao={a ? 'Editar avaliação' : 'Avaliar esta casa'} titulo={`Avaliar ${c.nome}`} variante={a ? 'contorno' : 'primario'}
                    rotuloEnvio="Salvar avaliação" mensagemSucesso="Avaliação salva. Obrigado!" limparAoConcluir={false}
                    campos={campos(a)}
                    acao={a
                      ? { tipo: 'update', tabela: 'avaliacoes', id: a.id }
                      : { tipo: 'insert', tabela: 'avaliacoes', extra: { usuario_id: sessao.id, ilpi_id: id } }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
