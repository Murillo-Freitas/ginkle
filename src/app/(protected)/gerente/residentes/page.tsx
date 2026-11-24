import type { Metadata } from 'next';
import Link from 'next/link';
import { BotaoAcao } from '@/components/features/botao-acao';
import { ModalFormulario, type CampoConfig } from '@/components/features/formulario-generico';
import { classesBotao } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { estiloCampo, estiloRotulo } from '@/components/ui/estilos';
import { exigirCasaGestor } from '@/lib/auth';
import { listarResidentesCasa } from '@/lib/dados';
import { primeiro } from '@/lib/registros';
import { createClient } from '@/lib/supabase/server';
import { TIPOS_SANGUINEOS } from '@/utils/constants';
import { calcularIdade } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Residentes' };

const camposResidente = (): CampoConfig[] => [
  { nome: 'nome_completo', rotulo: 'Nome completo', obrigatorio: true },
  { nome: 'data_nascimento', rotulo: 'Data de nascimento', tipo: 'data', obrigatorio: true, largura: 'metade' },
  { nome: 'sexo', rotulo: 'Sexo', tipo: 'select', largura: 'metade', opcoes: [{ valor: 'F', rotulo: 'Feminino' }, { valor: 'M', rotulo: 'Masculino' }, { valor: 'O', rotulo: 'Outro' }] },
  { nome: 'quarto', rotulo: 'Quarto', largura: 'metade' },
  { nome: 'tipo_sanguineo', rotulo: 'Tipo sanguíneo', tipo: 'select', obrigatorio: true, largura: 'metade', inicial: 'DESCONHECIDO', opcoes: TIPOS_SANGUINEOS.map((t) => ({ valor: t, rotulo: t === 'DESCONHECIDO' ? 'Desconhecido' : t })) },
  { nome: 'alergias', rotulo: 'Alergias', obrigatorio: true, inicial: 'Nenhuma conhecida', dica: 'Escreva “Nenhuma conhecida” se não houver.' },
  { nome: 'observacoes_medicas', rotulo: 'Observações médicas', tipo: 'textarea', maxLen: 1000 },
];

export default async function ResidentesGestor({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { casa } = await exigirCasaGestor();
  const sp = await searchParams;
  const q = primeiro(sp.q);
  const status = primeiro(sp.status) || 'ATIVO';
  const residentes = await listarResidentesCasa(await createClient(), casa.id, { q, status });

  return (
    <>
      <PageHeader
        titulo="Residentes" descricao="Cadastre e gerencie os residentes. Vincule os familiares na página de cada residente."
        acao={
          <ModalFormulario
            rotuloBotao="Novo residente" titulo="Cadastrar residente" descricao="Dados de saúde são sensíveis: preencha com atenção. Alergias e tipo sanguíneo são obrigatórios."
            rotuloEnvio="Cadastrar" mensagemSucesso="Residente cadastrado."
            campos={camposResidente()} acao={{ tipo: 'insert', tabela: 'residentes', extra: { ilpi_id: casa.id } }}
          />
        }
      />
      <form method="get" className="mb-5 grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <div><label htmlFor="q" className={estiloRotulo}>Buscar por nome ou quarto</label><input id="q" name="q" defaultValue={q} className={estiloCampo} /></div>
        <div>
          <label htmlFor="status" className={estiloRotulo}>Situação</label>
          <select id="status" name="status" defaultValue={status} className={estiloCampo}>
            <option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option><option value="todos">Todos</option>
          </select>
        </div>
        <button type="submit" className={classesBotao('primario', 'md')}>Filtrar</button>
      </form>

      {residentes.length === 0 ? (
        <EmptyState titulo="Nenhum residente encontrado" descricao="Cadastre o primeiro residente ou ajuste os filtros." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {residentes.map((r) => (
            <li key={r.id} className="flex flex-col rounded-xl border border-line bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-semibold">{r.nome_completo}</p>
                <Badge tom={r.status === 'ATIVO' ? 'ok' : 'neutro'}>{r.status === 'ATIVO' ? 'Ativo' : 'Inativo'}</Badge>
              </div>
              <p className="text-sm text-muted">{calcularIdade(r.data_nascimento)} anos{r.quarto ? ` · Quarto ${r.quarto}` : ''}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link href={`/gerente/residentes/${r.id}`} className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-sm font-semibold hover:bg-surface-alt">Abrir</Link>
                <BotaoAcao
                  rotulo={r.status === 'ATIVO' ? 'Registrar saída' : 'Reativar'}
                  acao={{ tipo: 'update', tabela: 'residentes', id: r.id, valores: { status: r.status === 'ATIVO' ? 'INATIVO' : 'ATIVO' } }}
                  confirmar={r.status === 'ATIVO' ? `Registrar a saída de ${r.nome_completo}? O histórico será mantido.` : undefined}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
