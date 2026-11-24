import type { Perfil } from '@/types';

const VALIDOS: Perfil[] = ['CLIENTE', 'FUNCIONARIO', 'GERENTE'];

/** Versão para o navegador (a versão do servidor está em lib/auth.ts). */
export function normalizarPerfisCliente(valor: unknown): Perfil[] {
  const lista = Array.isArray(valor) ? valor.filter((p): p is Perfil => VALIDOS.includes(p)) : [];
  return lista.length > 0 ? lista : ['CLIENTE'];
}
