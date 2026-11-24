export type Perfil = 'CLIENTE' | 'FUNCIONARIO' | 'GERENTE';
export type CargoEquipe = 'GESTOR' | 'ENFERMEIRO' | 'CUIDADOR' | 'OUTRO';
export type TipoRegistro = 'CUIDADO' | 'MEDICACAO' | 'SINAIS_VITAIS' | 'OCORRENCIA';

/** Dados mínimos da sessão (vêm do Auth, sem consultar o banco). */
export interface Sessao {
  id: string;
  email: string;
  nome: string;
  perfis: Perfil[];
  perfilAtivo: Perfil;
}

export interface Usuario {
  id: string;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  perfis: Perfil[];
}

/** No banco e nos documentos do TCC a tabela se chama "ilpis"; na interface usamos "casa de repouso". */
export interface Casa {
  id: string;
  nome_fantasia: string;
  razao_social?: string;
  cnpj?: string;
  telefone: string | null;
  email: string | null;
  site: string | null;
  descricao: string | null;
  cep: string;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string;
  uf: string;
  logo_url: string | null;
  capa_url: string | null;
  latitude?: number | null;
  longitude?: number | null;
  publicada: boolean;
  verificada: boolean;
}

export interface CasaResumo {
  id: string;
  nome_fantasia: string;
  cidade: string;
  uf: string;
  publicada: boolean;
  verificada: boolean;
  logo_url: string | null;
  capa_url: string | null;
}

export interface Residente {
  id: string;
  ilpi_id: string;
  nome_completo: string;
  sexo: 'F' | 'M' | 'O' | null;
  data_nascimento: string;
  quarto: string | null;
  tipo_sanguineo: string;
  alergias: string;
  observacoes_medicas: string | null;
  data_ingresso: string;
  status: 'ATIVO' | 'INATIVO';
}

export interface DadosVitais {
  pa_sistolica?: number;
  pa_diastolica?: number;
  fc?: number;
  temperatura?: number;
  spo2?: number;
  glicemia?: number;
  peso?: number;
}

export interface Registro {
  id: string;
  residente_id: string;
  tipo: TipoRegistro;
  categoria: string | null;
  titulo: string;
  descricao: string;
  urgente: boolean;
  medicamento: string | null;
  dose: string | null;
  lote: string | null;
  situacao: 'ADMINISTRADO' | 'RECUSADO' | 'ADIADO' | null;
  dados: DadosVitais | null;
  humor?: 'BEM' | 'ATENCAO' | 'ALERTA' | null;
  estado_geral?: 'BEM' | 'ATENCAO' | 'ALERTA' | null;
  assinado?: boolean;
  autor_nome: string;
  autor_cargo: string | null;
  criado_em_dispositivo: string;
  residente?: { nome_completo: string } | null;
}

export interface Plano {
  id: string;
  codigo: 'ESSENCIAL' | 'PROFISSIONAL';
  nome: string;
  descricao: string | null;
  valor_mensal: number;
  max_residentes: number | null;
}
