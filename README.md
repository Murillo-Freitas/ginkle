# Ginkle

Sistema de gestão para casas de repouso e portal de acompanhamento para famílias. Trabalho de Conclusão de Curso da equipe Viventi, ETEC de Praia Grande (Centro Paula Souza).

> Na interface do sistema usa-se "casa de repouso". O termo técnico **ILPI** (Instituição de Longa Permanência para Idosos) é mantido no banco (`ilpis`) e nos documentos do TCC.

## Tecnologias

Next.js 15 (App Router) · React 18 · TypeScript · Tailwind CSS 4 · Supabase (Auth, PostgreSQL, Storage e Realtime).

## Como rodar

```bash
npm install
cp .env.example .env.local      # preencha com os dados do seu projeto Supabase
npm run dev                     # http://localhost:3000
npm run typecheck               # verificação de tipos
npm run build                   # build de produção
```

Antes de rodar, siga **`docs/GUIA_INSTALACAO_TESTES.md`** para extrair, configurar o `.env.local`, instalar e testar o projeto. Para detalhes do banco, autenticação e SMTP do Supabase, consulte **`docs/GUIA_SUPABASE.md`** (o banco começa com `supabase/01_schema.sql`).

## Áreas do sistema

**Público:** início, sobre nós, privacidade, diretório de casas de repouso (filtros por nome, cidade, UF e CEP) e página de cada casa com avaliações.

**Acesso:** cadastro com CEP e confirmação de e-mail, login, "esqueci a senha" e redefinição de senha.

**Portal do familiar** (`/cliente/*`): início · meus familiares · linha do tempo do residente (filtros por período e tipo) · cronograma · solicitações · financeiro · chat · avaliar casa · perfil.

**Painel do funcionário** (`/funcionario/*`): meu turno · residentes · página do residente · novo registro · cuidados · medicamentos · sinais vitais · ocorrências · atividades do dia · histórico de registros · chat · minha escala · perfil.

**Painel do gestor** (`/gerente/*`): painel · minhas casas · criar/editar casa · detalhes da casa · equipe e escala · atividades · residentes e familiares · solicitações · planos · financeiro e assinantes · histórico de ações (auditoria, com exportação CSV) · chat · perfil.

Quem acessa o quê é decidido em dois lugares: o **middleware** (`src/middleware.ts`) barra a rota se o perfil não existir na conta e, no **banco**, as regras de segurança (RLS) impedem a leitura de dados de outras pessoas, mesmo que alguém tente consultar a API diretamente.

## Recursos da versão 2

- **Cronograma semanal** de atividades (gestor monta, funcionário marca presença com um clique, família acompanha ao vivo).
- **Notificações push** (mensagens do chat e ocorrências urgentes) e **resumo diário por e-mail via SendGrid API** (opcional).
- **Relatório do residente em PDF**, **recibos numerados** das mensalidades pagas e **histórico de ações em PDF e CSV**.
- **Modo offline** para registros de cuidado (fila no aparelho, envio automático) e **site instalável** (PWA).
- **Assinatura da medicação** por senha, **indicadores de humor e saúde** (verde, amarelo e vermelho).
- **Segurança de acesso:** bloqueio temporário após 5 senhas erradas e sessão encerrada após 90 minutos sem uso.
- **Casas:** envio de alvará e licenças em PDF, localização no mapa e busca por distância.
- **Moderação** de comentários nas avaliações.

Para ativar tudo, rode também `supabase/03_atualizacao_v2.sql` e configure as variáveis extras do `.env.example` (guia: seção 12 de `docs/GUIA_SUPABASE.md`). Depois de baixar o projeto, rode `npm install` (foram adicionadas as bibliotecas `pdf-lib` e `web-push`).

## Estrutura

```
supabase/                 01_schema.sql (banco), 02_dados_demonstracao.sql, 03_atualizacao_v2.sql
docs/                     guia do Supabase, guia de imagens e matriz de requisitos
public/images, brand      imagens otimizadas e símbolo da marca
src/app/(public)          páginas públicas
src/app/(auth)            login, cadastro, verificação e senha
src/app/(protected)       cliente/, funcionario/, gerente/, minha-conta, cadastrar-casa
src/app/auth/confirm      rota chamada pelo link do e-mail
src/components/ui         botões, campos, cartões, alertas, modal, paginação
src/components/layout     cabeçalho, rodapé e menus dos painéis
src/components/features   formulários, chat, registros, upload de imagem
src/lib                   Supabase (cliente/servidor/middleware), sessão, consultas
src/utils                 validadores (CPF, CNPJ, CEP), formatadores, constantes
```

## Identidade visual

A paleta dos slides está em `src/app/globals.css` (variáveis claras e escuras) e nas classes `brand-*` do Tailwind. Fontes: **Syne** (títulos) e **Inter** (texto), carregadas pelo `next/font`. O tema padrão é claro; o escuro é opcional (botão na barra superior). O texto principal tem 16 px, as áreas de toque têm 44 px e o foco do teclado é sempre visível, pensando em familiares mais velhos.

## Desempenho

- Imagens em WebP (de 1 a 14 MB para cerca de 35 a 75 KB cada) com o componente `<Image>`.
- Dados carregados no servidor (sem "tela vazia e depois dados") e esqueletos de carregamento por rota.
- Fontes autohospedadas (sem pedidos ao Google) e ícones sob demanda.
- Sessão consultada uma vez por requisição. Hospedagem sugerida na região de São Paulo (`vercel.json` e projeto Supabase em São Paulo).
- Upload de fotos reduz e converte a imagem no navegador antes de enviar.

## Decisões de segurança

- Perfis ficam em `app_metadata` (o usuário não consegue se promover a gestor); o perfil de gestor nasce ao cadastrar uma casa.
- Registros de cuidado, mensagens e logs são imutáveis (sem edição ou exclusão).
- Autor, casa e cargo dos registros são preenchidos pelo banco, não pelo navegador.
- Dados financeiros ficam restritos ao gestor e ao responsável financeiro.
- O diretório público só enxerga colunas liberadas (sem CNPJ ou razão social).
- Chaves ficam em `.env.local`, que está no `.gitignore`. Nunca envie esse arquivo.

## Limitações conhecidas

Veja `docs/MATRIZ_REQUISITOS.md`. Em resumo: não há gateway de pagamento (a baixa é manual); a assinatura da medicação é uma confirmação de senha; o modo offline vale para a tela já aberta; o bloqueio de login vale para quem entra pelo site; no iPhone, o push exige instalar o Ginkle na tela inicial.
