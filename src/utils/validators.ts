import { soDigitos } from './formatters';

export function validarCPF(cpf: string): boolean {
  const d = soDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(d[t])) return false;
  }
  return true;
}

export function validarCNPJ(cnpj: string): boolean {
  const d = soDigitos(cnpj);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calcular = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split('').reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calcular(d.slice(0, 12));
  const d2 = calcular(d.slice(0, 12) + d1);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}

export const validarCEP = (cep: string) => soDigitos(cep).length === 8;

export function validarTelefone(tel: string): boolean {
  const n = soDigitos(tel).length;
  return n === 10 || n === 11;
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export interface RegrasSenha {
  tamanho: boolean;
  maiuscula: boolean;
  numero: boolean;
  especial: boolean;
}

export function avaliarSenha(senha: string): RegrasSenha {
  return {
    tamanho: senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    numero: /\d/.test(senha),
    especial: /[^A-Za-z0-9]/.test(senha),
  };
}

export const senhaForte = (senha: string) => Object.values(avaliarSenha(senha)).every(Boolean);

/** Aceita somente caminhos internos (evita open redirect). */
export function caminhoSeguro(destino: string | null | undefined, padrao: string): string {
  return destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : padrao;
}

export const ehUUID = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
