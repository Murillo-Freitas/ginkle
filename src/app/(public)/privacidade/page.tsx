import type { Metadata } from 'next';
import { Alert } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Privacidade e dados' };

export default function PrivacidadePage() {
  const h2 = 'mt-8 text-xl font-bold';
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader titulo="Privacidade e proteção de dados" descricao="Como o Ginkle trata os dados, de acordo com os princípios da Lei Geral de Proteção de Dados (LGPD)." />
      <Alert tipo="aviso" titulo="Texto de apoio do projeto acadêmico">
        Este resumo descreve o funcionamento do sistema. Antes de uso real com dados de pessoas, o texto deve ser revisado por profissional jurídico.
      </Alert>

      <h2 className={h2}>Quais dados coletamos</h2>
      <p className="mt-2">Dados de cadastro (nome, CPF, data de nascimento, telefone, e-mail e endereço) e, no caso de residentes, dados de saúde e de rotina registrados pela equipe da casa de repouso.</p>

      <h2 className={h2}>Para que usamos</h2>
      <p className="mt-2">Para identificar você, permitir o acesso ao sistema, vincular famílias a residentes, registrar o cuidado prestado, sugerir casas de repouso próximas e manter o histórico de ações para auditoria.</p>

      <h2 className={h2}>Quem pode ver</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        <li>A família vê somente os residentes aos quais está vinculada.</li>
        <li>A equipe da casa vê somente os residentes da própria casa.</li>
        <li>Dados financeiros ficam restritos ao gestor e ao responsável financeiro indicado.</li>
        <li>O diretório público mostra apenas dados da casa de repouso, nunca de residentes.</li>
      </ul>

      <h2 className={h2}>Seus direitos</h2>
      <p className="mt-2">Você pode pedir acesso, correção ou exclusão dos seus dados, entre outros direitos previstos no art. 18 da LGPD. Nos dados de cuidado, a exclusão pode ser limitada por obrigações de guarda e auditoria.</p>

      <h2 className={h2}>Segurança</h2>
      <p className="mt-2">As senhas são armazenadas de forma protegida pelo serviço de autenticação, o acesso é controlado por perfil e os registros de cuidado não podem ser alterados ou apagados.</p>
    </div>
  );
}
