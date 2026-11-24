import { FUSO } from './constants';

export const soDigitos = (v: string) => (v ?? '').replace(/\D/g, '');

export function formatarCPF(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export function formatarCNPJ(v: string): string {
  const d = soDigitos(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function formatarCEP(v: string): string {
  const d = soDigitos(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function formatarTelefone(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' sem passar por Date (evita deslocamento de fuso). */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: FUSO, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' });
}

export function formatarCompetencia(iso: string): string {
  const [a, m] = iso.slice(0, 7).split('-');
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return `${meses[Number(m) - 1]} de ${a}`;
}

export function hojeISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: FUSO });
}

export function calcularIdade(nascimentoIso: string): number {
  const [a, m, d] = nascimentoIso.slice(0, 10).split('-').map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) idade--;
  return idade;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export function formatarMoeda(valor: number): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function enderecoEmLinha(c: {
  logradouro?: string | null; numero?: string | null; bairro?: string | null; cidade?: string | null; uf?: string | null;
}): string {
  const rua = [c.logradouro, c.numero].filter(Boolean).join(', ');
  const cidade = [c.cidade, c.uf].filter(Boolean).join(' - ');
  return [rua, c.bairro, cidade].filter(Boolean).join(' · ');
}

/** Valor digitado em reais ("3.800,50" ou "3800.5") -> número. */
export function paraNumero(texto: string): number {
  const t = texto.trim().replace(/\s/g, '');
  const normal = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  return Number(normal);
}

/** Dia da semana (0 = domingo) de uma data 'YYYY-MM-DD'. */
export function diaDaSemana(iso: string): number {
  return new Date(`${iso}T12:00:00-03:00`).getUTCDay();
}

export const horaCurta = (t: string | null | undefined) => (t ? t.slice(0, 5) : '');
