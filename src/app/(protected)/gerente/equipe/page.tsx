import type { Metadata } from 'next';
import { CalendarX } from 'lucide-react';
import { BotaoAcao } from '@/components/features/botao-acao';
import { ModalFormulario } from '@/components/features/formulario-generico';
import { Card, PageHeader } from '@/components/ui/card';
import { Badge, EmptyState } from '@/components/ui/feedback';
import { exigirCasaGestor } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CARGOS_EQUIPE, FUSO, ROTULO_CARGO, TURNOS } from '@/utils/constants';
import { formatarData, formatarTelefone, hojeISO } from '@/utils/formatters';

export const metadata: Metadata = { title: 'Equipe' };

interface Vinculo {
  id: string; cargo: string; ativo: boolean; data_vinculo: string; data_desligamento: string | null;
  usuario: { nome_completo: string; email: string; telefone: string } | null; usuario_id: string;
}
interface Turno { id: string; data: string; turno: string; observacao: string | null; usuario: { nome_completo: string } | null }

export default async function EquipePage() {
  const { casa } = await exigirCasaGestor();
  const supabase = await createClient();
  const hoje = hojeISO();

  const [{ data: v }, { data: e }] = await Promise.all([
    supabase.from('vinculos_ilpi').select('id, usuario_id, cargo, ativo, data_vinculo, data_desligamento, usuario:usuarios(nome_completo, email, telefone)')
      .eq('ilpi_id', casa.id).order('ativo', { ascending: false }).order('data_vinculo'),
    supabase.from('escalas').select('id, data, turno, observacao, usuario:usuarios(nome_completo)')
      .eq('ilpi_id', casa.id).gte('data', hoje).order('data').limit(60),
  ]);
  const vinculos = (v ?? []) as unknown as Vinculo[];
  const turnos = (e ?? []) as unknown as Turno[];
  const ativos = vinculos.filter((x) => x.ativo);
  const rotuloDia = (iso: string) =>
    new Date(`${iso}T12:00:00-03:00`).toLocaleDateString('pt-BR', { timeZone: FUSO, weekday: 'short', day: '2-digit', month: '2-digit' });

  return (
    <>
      <PageHeader
        titulo="Equipe" descricao="Vincule funcionários que já criaram conta no Ginkle. O vínculo é feito pelo CPF ou e-mail e libera o painel do funcionário."
        acao={
          <ModalFormulario
            rotuloBotao="Vincular funcionário" titulo="Vincular funcionário"
            descricao="A pessoa precisa ter criado uma conta no Ginkle. Informe o CPF ou o e-mail cadastrado."
            rotuloEnvio="Vincular" mensagemSucesso="Funcionário vinculado."
            campos={[
              { nome: 'p_identificador', rotulo: 'CPF ou e-mail do funcionário', obrigatorio: true },
              { nome: 'p_cargo', rotulo: 'Cargo', tipo: 'select', obrigatorio: true, inicial: 'CUIDADOR', opcoes: CARGOS_EQUIPE.map((c) => ({ valor: c.valor, rotulo: c.rotulo })) },
            ]}
            acao={{ tipo: 'rpc', nome: 'vincular_funcionario', extra: { p_ilpi: casa.id } }}
          />
        }
      />

      <Card className="!p-0">
        <ul className="divide-y divide-line">
          {vinculos.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="font-semibold">{x.usuario?.nome_completo ?? 'Usuário'}</p>
                <p className="break-all text-sm text-muted">{x.usuario?.email}{x.usuario?.telefone ? ` · ${formatarTelefone(x.usuario.telefone)}` : ''}</p>
                <p className="mt-1 text-sm text-muted">Desde {formatarData(x.data_vinculo)}{x.data_desligamento ? ` · desligado em ${formatarData(x.data_desligamento)}` : ''}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{ROTULO_CARGO[x.cargo] ?? x.cargo}</Badge>
                {x.ativo ? <Badge tom="ok">Ativo</Badge> : <Badge tom="neutro">Desligado</Badge>}
                {x.ativo && x.cargo !== 'GESTOR' && (
                  <BotaoAcao rotulo="Desvincular" acao={{ tipo: 'rpc', nome: 'desvincular_funcionario', args: { p_vinculo: x.id } }}
                    confirmar={`Desvincular ${x.usuario?.nome_completo ?? 'este funcionário'}? O histórico dos registros dele será mantido.`} />
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <section className="mt-10" aria-labelledby="escala">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="escala" className="text-2xl font-bold">Escala</h2>
          <ModalFormulario
            rotuloBotao="Adicionar turno" titulo="Adicionar turno" variante="contorno"
            rotuloEnvio="Salvar turno" mensagemSucesso="Turno adicionado." limparAoConcluir
            campos={[
              { nome: 'usuario_id', rotulo: 'Funcionário', tipo: 'select', obrigatorio: true, opcoes: ativos.map((a) => ({ valor: a.usuario_id, rotulo: a.usuario?.nome_completo ?? 'Usuário' })) },
              { nome: 'data', rotulo: 'Data', tipo: 'data', obrigatorio: true, largura: 'metade' },
              { nome: 'turno', rotulo: 'Turno', tipo: 'select', obrigatorio: true, largura: 'metade', opcoes: Object.entries(TURNOS).map(([valor, rotulo]) => ({ valor, rotulo })) },
              { nome: 'observacao', rotulo: 'Observação (opcional)', maxLen: 120 },
            ]}
            acao={{ tipo: 'insert', tabela: 'escalas', extra: { ilpi_id: casa.id } }}
          />
        </div>
        {turnos.length === 0 ? (
          <EmptyState icone={<CalendarX className="size-10" />} titulo="Nenhum turno futuro lançado" descricao="Adicione turnos para que cada funcionário veja a própria escala." />
        ) : (
          <Card className="!p-0">
            <ul className="divide-y divide-line">
              {turnos.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold"><span className="capitalize">{rotuloDia(t.data)}</span> · {t.usuario?.nome_completo}</p>
                    {t.observacao && <p className="text-sm text-muted">{t.observacao}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{TURNOS[t.turno]}</Badge>
                    <BotaoAcao rotulo="Remover" acao={{ tipo: 'delete', tabela: 'escalas', id: t.id }} confirmar="Remover este turno da escala?" />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </>
  );
}
