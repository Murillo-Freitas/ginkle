import type { Metadata } from 'next';
import { BotaoAcao } from '@/components/features/botao-acao';
import { CronogramaSemana, type AtividadeLinha } from '@/components/features/cronograma-semana';
import { ModalFormulario, type CampoConfig } from '@/components/features/formulario-generico';
import { Alert } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/card';
import { exigirCasaGestor } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIAS_ATIVIDADE, DIAS_SEMANA } from '@/utils/constants';
import { diaDaSemana, horaCurta, hojeISO } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Atividades' };

const campos = (a?: AtividadeLinha): CampoConfig[] => [
  { nome: 'titulo', rotulo: 'Atividade', obrigatorio: true, maxLen: 80, inicial: a?.titulo ?? '', placeholder: 'Ex.: Caminhada no jardim' },
  { nome: 'categoria', rotulo: 'Categoria', tipo: 'select', obrigatorio: true, largura: 'metade', inicial: a?.categoria ?? '', opcoes: Object.entries(CATEGORIAS_ATIVIDADE).map(([valor, rotulo]) => ({ valor, rotulo })) },
  { nome: 'dia_semana', rotulo: 'Dia da semana', tipo: 'select', obrigatorio: true, largura: 'metade', inicial: a ? String(a.dia_semana) : '', opcoes: DIAS_SEMANA.map((rotulo, i) => ({ valor: String(i), rotulo })) },
  { nome: 'hora_inicio', rotulo: 'Início', tipo: 'hora', obrigatorio: true, largura: 'metade', inicial: horaCurta(a?.hora_inicio) },
  { nome: 'hora_fim', rotulo: 'Fim (opcional)', tipo: 'hora', largura: 'metade', inicial: horaCurta(a?.hora_fim) },
  { nome: 'local', rotulo: 'Local (opcional)', maxLen: 80, inicial: a?.local ?? '' },
  { nome: 'descricao', rotulo: 'Detalhes (opcional)', tipo: 'textarea', maxLen: 300, inicial: a?.descricao ?? '' },
];

export default async function AtividadesGestor() {
  const { casa } = await exigirCasaGestor();
  const { data } = await (await createClient())
    .from('atividades')
    .select('id, titulo, descricao, categoria, dia_semana, hora_inicio, hora_fim, local, ativa')
    .eq('ilpi_id', casa.id)
    .order('hora_inicio');
  const atividades = (data ?? []) as unknown as AtividadeLinha[];

  return (
    <>
      <PageHeader
        titulo="Atividades da semana"
        descricao="Cronograma que se repete toda semana: atividades físicas, sociais, alimentação, medicação e rotina. As famílias veem as alterações em tempo real."
        acao={
          <ModalFormulario
            rotuloBotao="Nova atividade" titulo="Nova atividade" rotuloEnvio="Salvar" mensagemSucesso="Atividade adicionada ao cronograma."
            campos={campos()} acao={{ tipo: 'insert', tabela: 'atividades', extra: { ilpi_id: casa.id } }}
          />
        }
      />
      {atividades.length === 0 && <div className="mb-5"><Alert tipo="info">Nenhuma atividade cadastrada ainda. Comece pela rotina diária (refeições, medicação) e depois acrescente as atividades.</Alert></div>}
      <CronogramaSemana
        atividades={atividades}
        hoje={diaDaSemana(hojeISO())}
        acoes={(a) => (
          <>
            <ModalFormulario rotuloBotao="Editar" titulo="Editar atividade" variante="contorno" tamanho="sm" rotuloEnvio="Salvar" mensagemSucesso="Atividade atualizada." limparAoConcluir={false}
              campos={campos(a)} acao={{ tipo: 'update', tabela: 'atividades', id: a.id }} />
            <BotaoAcao rotulo={a.ativa ? 'Pausar' : 'Reativar'} acao={{ tipo: 'update', tabela: 'atividades', id: a.id, valores: { ativa: !a.ativa } }} />
            <BotaoAcao rotulo="Remover" acao={{ tipo: 'delete', tabela: 'atividades', id: a.id }} confirmar={`Remover "${a.titulo}" do cronograma? O histórico de presença dessa atividade também será apagado.`} />
          </>
        )}
      />
    </>
  );
}
