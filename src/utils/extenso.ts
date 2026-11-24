const UN = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze',
  'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CEN = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function ate999(n: number): string {
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100);
  const r = n % 100;
  const partes: string[] = [];
  if (c) partes.push(CEN[c]);
  if (r) partes.push(r < 20 ? UN[r] : DEZ[Math.floor(r / 10)] + (r % 10 ? ` e ${UN[r % 10]}` : ''));
  return partes.join(' e ');
}

function inteiro(n: number): string {
  if (n === 0) return 'zero';
  if (n < 1000) return ate999(n);
  if (n < 1_000_000) {
    const m = Math.floor(n / 1000);
    const r = n % 1000;
    const milhar = m === 1 ? 'mil' : `${ate999(m)} mil`;
    return r ? `${milhar}${r < 100 || r % 100 === 0 ? ' e ' : ' '}${ate999(r)}` : milhar;
  }
  const mi = Math.floor(n / 1_000_000);
  const r = n % 1_000_000;
  const milhoes = mi === 1 ? 'um milhão' : `${ate999(mi)} milhões`;
  return r ? `${milhoes}${r < 100 ? ' e ' : ' '}${inteiro(r)}` : milhoes;
}

/** 3500.5 -> "três mil e quinhentos reais e cinquenta centavos" */
export function valorPorExtenso(valor: number): string {
  const centavosTotais = Math.round(valor * 100);
  const reais = Math.floor(centavosTotais / 100);
  const c = centavosTotais % 100;
  const partes: string[] = [];
  if (reais) partes.push(`${inteiro(reais)} ${reais === 1 ? 'real' : 'reais'}`);
  if (c) partes.push(`${inteiro(c)} ${c === 1 ? 'centavo' : 'centavos'}`);
  return partes.length ? partes.join(' e ') : 'zero real';
}
