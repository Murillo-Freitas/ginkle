import type { Perfil, TipoRegistro } from '@/types';

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ',
  'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export const NOME_PERFIL: Record<Perfil, string> = {
  CLIENTE: 'Familiar',
  FUNCIONARIO: 'Equipe',
  GERENTE: 'Gestor',
};

export const DASHBOARD_POR_PERFIL: Record<Perfil, string> = {
  CLIENTE: '/cliente/dashboard',
  FUNCIONARIO: '/funcionario/dashboard',
  GERENTE: '/gerente/dashboard',
};

export const TIPOS_REGISTRO: Record<TipoRegistro, string> = {
  CUIDADO: 'Cuidado',
  MEDICACAO: 'Medicação',
  SINAIS_VITAIS: 'Sinais vitais',
  OCORRENCIA: 'Ocorrência',
};

export const CATEGORIAS_CUIDADO = [
  'Higiene e banho', 'Alimentação', 'Hidratação', 'Mobilidade', 'Sono e repouso', 'Atividade e socialização', 'Outro',
] as const;

export const CATEGORIAS_OCORRENCIA = [
  'Queda', 'Mal-estar', 'Alteração de comportamento', 'Recusa de alimentação', 'Outra',
] as const;

export const SITUACOES_MEDICACAO: Record<string, string> = {
  ADMINISTRADO: 'Administrado',
  RECUSADO: 'Recusado',
  ADIADO: 'Adiado',
};

export const PERIODOS = [
  { valor: '7d', rotulo: 'Últimos 7 dias' },
  { valor: '30d', rotulo: 'Últimos 30 dias' },
  { valor: 'mes', rotulo: 'Mês atual' },
  { valor: 'tudo', rotulo: 'Todo o período' },
] as const;

export const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'DESCONHECIDO'] as const;

export const PARENTESCOS = [
  'Filho(a)', 'Neto(a)', 'Cônjuge', 'Irmão(ã)', 'Sobrinho(a)', 'Genro/Nora', 'Amigo(a)', 'Outro',
] as const;

export const CARGOS_EQUIPE = [
  { valor: 'CUIDADOR', rotulo: 'Cuidador(a)' },
  { valor: 'ENFERMEIRO', rotulo: 'Enfermeiro(a)' },
  { valor: 'OUTRO', rotulo: 'Outro cargo' },
] as const;

export const ROTULO_CARGO: Record<string, string> = {
  GESTOR: 'Gestor(a)',
  CUIDADOR: 'Cuidador(a)',
  ENFERMEIRO: 'Enfermeiro(a)',
  OUTRO: 'Equipe',
};

export const TURNOS: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
  PLANTAO_12H: 'Plantão 12h',
};

export const POR_PAGINA = 10;
export const FUSO = 'America/Sao_Paulo';

export const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'] as const;
/** Ordem de exibição da semana (segunda a domingo). */
export const ORDEM_SEMANA = [1, 2, 3, 4, 5, 6, 0] as const;

export const CATEGORIAS_ATIVIDADE: Record<string, string> = {
  FISICA: 'Atividade física',
  SOCIAL: 'Atividade social',
  ALIMENTACAO: 'Alimentação',
  MEDICACAO: 'Medicação',
  ROTINA: 'Rotina',
};

export const SITUACOES_PRESENCA: Record<string, string> = {
  PARTICIPOU: 'Participou',
  NAO_PARTICIPOU: 'Não participou',
  RECUSOU: 'Recusou',
};

export const ROTULO_NIVEL: Record<string, string> = { BEM: 'Bem', ATENCAO: 'Atenção', ALERTA: 'Alerta' };
