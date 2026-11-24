import type { Metadata } from 'next';
import Link from 'next/link';
import { PerfilForm } from '@/components/features/perfil-form';
import { PreferenciasNotificacao } from '@/components/features/preferencias-notificacao';
import { SolicitarAlteracaoSenha } from '@/components/features/auth/solicitar-alteracao-senha';
import { LinkButton } from '@/components/ui/button';
import { Card, PageHeader } from '@/components/ui/card';
import { Alert, Badge } from '@/components/ui/feedback';
import { exigirSessao, getVinculos } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DASHBOARD_POR_PERFIL, ROTULO_CARGO } from '@/utils/constants';
import type { Usuario } from '@/types';

export const metadata: Metadata = { title: 'Minha conta' };

export default async function MinhaContaPage() {
  const sessao = await exigirSessao();
  const supabase = await createClient();
  const [{ data }, vinculos, { data: prefsData }] = await Promise.all([
    supabase
      .from('usuarios')
      .select('id, nome_completo, cpf, data_nascimento, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, uf, perfis')
      .eq('id', sessao.id)
      .maybeSingle(),
    getVinculos(),
    supabase.from('preferencias_notificacao').select('push_chat, push_urgente, push_solicitacoes, resumo_diario').eq('usuario_id', sessao.id).maybeSingle(),
  ]);
  const prefs = (prefsData as { push_chat: boolean; push_urgente: boolean; push_solicitacoes: boolean; resumo_diario: boolean } | null) ?? { push_chat: true, push_urgente: true, push_solicitacoes: true, resumo_diario: false };
  const usuario = data as unknown as Usuario | null;
  const equipe = vinculos.filter((v) => v.cargo !== 'GESTOR');
  const gestor = vinculos.filter((v) => v.cargo === 'GESTOR');

  return (
    <>
      <PageHeader titulo="Minha conta" descricao="Atualize seus dados, veja seus perfis de acesso e altere a senha." />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card>
          {usuario ? (
            <PerfilForm usuario={usuario} />
          ) : (
            <Alert tipo="aviso" titulo="Cadastro incompleto">
              Sua conta foi criada fora do formulário de cadastro e ainda não tem dados pessoais. Crie uma conta pelo cadastro do Ginkle para usar o sistema.
            </Alert>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold">Meus perfis</h2>
            <ul className="mt-3 space-y-4">
              <li>
                <div className="flex items-center justify-between gap-2"><span className="font-semibold">Familiar</span><Badge tom="ok">Ativo</Badge></div>
                <p className="mt-1 text-sm text-muted">Acompanhe residentes, converse com a casa e avalie.</p>
                <Link href={DASHBOARD_POR_PERFIL.CLIENTE} className="mt-1 inline-block text-sm font-semibold text-accent underline-offset-4 hover:underline">Abrir portal do familiar</Link>
              </li>
              <li>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">Funcionário</span>
                  {sessao.perfis.includes('FUNCIONARIO') ? <Badge tom="ok">Ativo</Badge> : <Badge>Não habilitado</Badge>}
                </div>
                {equipe.length > 0 ? (
                  <>
                    <p className="mt-1 text-sm text-muted">{equipe.map((v) => `${ROTULO_CARGO[v.cargo] ?? 'Equipe'} em ${v.ilpi.nome_fantasia}`).join(' · ')}</p>
                    <Link href={DASHBOARD_POR_PERFIL.FUNCIONARIO} className="mt-1 inline-block text-sm font-semibold text-accent underline-offset-4 hover:underline">Abrir painel do funcionário</Link>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted">Habilitado pelo gestor da casa de repouso, que vincula a sua conta pelo CPF ou e-mail.</p>
                )}
              </li>
              <li>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">Gestor</span>
                  {sessao.perfis.includes('GERENTE') ? <Badge tom="ok">Ativo</Badge> : <Badge>Não habilitado</Badge>}
                </div>
                {gestor.length > 0 ? (
                  <>
                    <p className="mt-1 text-sm text-muted">{gestor.map((v) => v.ilpi.nome_fantasia).join(' · ')}</p>
                    <Link href={DASHBOARD_POR_PERFIL.GERENTE} className="mt-1 inline-block text-sm font-semibold text-accent underline-offset-4 hover:underline">Abrir painel do gestor</Link>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-muted">O perfil de gestor é habilitado ao cadastrar uma casa de repouso.</p>
                    <div className="mt-2"><LinkButton href="/cadastrar-casa" variante="contorno" tamanho="sm">Cadastrar casa de repouso</LinkButton></div>
                  </>
                )}
              </li>
            </ul>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-bold">Notificações</h2>
            <PreferenciasNotificacao usuarioId={sessao.id} inicial={prefs} />
          </Card>

          <Card>
            <h2 className="text-lg font-bold">Segurança</h2>
            <SolicitarAlteracaoSenha />
          </Card>
        </div>
      </div>
    </>
  );
}
