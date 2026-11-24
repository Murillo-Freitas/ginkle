import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { FUSO } from '@/utils/constants';

export interface ColunaPdf { titulo: string; largura: number } // largura em proporção da página (a soma deve ser 1)
export interface SecaoPdf {
  titulo?: string;
  paragrafos?: string[];
  tabela?: { colunas: ColunaPdf[]; linhas: string[][] };
  vazio?: string;
}
export interface DocumentoPdf { titulo: string; subtitulo?: string; secoes: SecaoPdf[]; rodape?: string }

const VERDE = rgb(0.165, 0.325, 0.173);
const CINZA = rgb(0.29, 0.38, 0.31);
const TEXTO = rgb(0.06, 0.12, 0.06);
const LINHA = rgb(0.79, 0.86, 0.79);
const FUNDO = rgb(0.894, 0.941, 0.898);

/** As fontes padrão do PDF só aceitam Latin-1: remove o que estiver fora (ex.: "₂" vira "2"). */
export function limparTexto(t: string): string {
  return (t ?? '')
    .replace(/₂/g, '2')
    .replace(/→/g, '->')
    .replace(/\r/g, '')
    .replace(/[^\n\u0020-\u007E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/g, '');
}

function quebrar(texto: string, fonte: PDFFont, tam: number, larg: number): string[] {
  const saida: string[] = [];
  for (const paragrafo of limparTexto(texto).split('\n')) {
    let atual = '';
    for (const palavra of paragrafo.split(/\s+/).filter(Boolean)) {
      const tentativa = atual ? `${atual} ${palavra}` : palavra;
      if (fonte.widthOfTextAtSize(tentativa, tam) <= larg) {
        atual = tentativa;
        continue;
      }
      if (atual) saida.push(atual);
      let resto = palavra;
      while (fonte.widthOfTextAtSize(resto, tam) > larg && resto.length > 1) {
        let n = resto.length;
        while (n > 1 && fonte.widthOfTextAtSize(resto.slice(0, n), tam) > larg) n--;
        saida.push(resto.slice(0, n));
        resto = resto.slice(n);
      }
      atual = resto;
    }
    saida.push(atual);
  }
  return saida.length ? saida : [''];
}

export async function gerarPdf(doc: DocumentoPdf): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(limparTexto(doc.titulo));
  pdf.setCreator('Ginkle');
  pdf.setProducer('Ginkle');
  const fonte = await pdf.embedFont(StandardFonts.Helvetica);
  const negrito = await pdf.embedFont(StandardFonts.HelveticaBold);

  const LARG = 595.28;
  const ALT = 841.89;
  const M = 48;
  const W = LARG - 2 * M;
  const BASE = 56; // área reservada ao rodapé

  let pagina: PDFPage = pdf.addPage([LARG, ALT]);
  let y = ALT - M;
  const nova = () => {
    pagina = pdf.addPage([LARG, ALT]);
    y = ALT - M;
  };
  const garantir = (h: number) => {
    if (y - h < BASE) nova();
  };

  pagina.drawRectangle({ x: 0, y: ALT - 72, width: LARG, height: 72, color: VERDE });
  pagina.drawText('Ginkle', { x: M, y: ALT - 38, size: 22, font: negrito, color: rgb(1, 1, 1) });
  pagina.drawText('Cuidar com tecnologia, conectar com humanidade', { x: M, y: ALT - 56, size: 8.5, font: fonte, color: rgb(0.89, 0.94, 0.9) });
  y = ALT - 104;

  for (const l of quebrar(doc.titulo, negrito, 16, W)) {
    pagina.drawText(l, { x: M, y, size: 16, font: negrito, color: VERDE });
    y -= 20;
  }
  if (doc.subtitulo) {
    for (const l of quebrar(doc.subtitulo, fonte, 10, W)) {
      pagina.drawText(l, { x: M, y, size: 10, font: fonte, color: CINZA });
      y -= 14;
    }
  }
  y -= 8;

  const desenharTabela = (t: NonNullable<SecaoPdf['tabela']>) => {
    const larguras = t.colunas.map((c) => c.largura * W);
    const pad = 4;
    const tam = 8.5;
    const alturaLinha = 11;
    const cabecalho = () => {
      garantir(26);
      pagina.drawRectangle({ x: M, y: y - 16, width: W, height: 18, color: FUNDO });
      let x = M;
      t.colunas.forEach((c, i) => {
        pagina.drawText(limparTexto(c.titulo), { x: x + pad, y: y - 10, size: tam, font: negrito, color: VERDE });
        x += larguras[i];
      });
      y -= 20;
    };
    cabecalho();
    for (const linha of t.linhas) {
      const celulas = linha.map((c, i) => quebrar(c, fonte, tam, larguras[i] - 2 * pad));
      const n = Math.max(...celulas.map((c) => c.length));
      const h = n * alturaLinha + 2 * pad;
      if (y - h < BASE) {
        nova();
        cabecalho();
      }
      let x = M;
      celulas.forEach((ls, i) => {
        ls.forEach((l, k) => {
          pagina.drawText(l, { x: x + pad, y: y - pad - 8 - k * alturaLinha, size: tam, font: fonte, color: TEXTO });
        });
        x += larguras[i];
      });
      y -= h;
      pagina.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.4, color: LINHA });
    }
    y -= 6;
  };

  for (const s of doc.secoes) {
    if (s.titulo) {
      garantir(48);
      y -= 6;
      pagina.drawText(limparTexto(s.titulo), { x: M, y, size: 12, font: negrito, color: VERDE });
      y -= 6;
      pagina.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.8, color: LINHA });
      y -= 14;
    }
    for (const p of s.paragrafos ?? []) {
      for (const l of quebrar(p, fonte, 10, W)) {
        garantir(14);
        pagina.drawText(l, { x: M, y, size: 10, font: fonte, color: TEXTO });
        y -= 14;
      }
      y -= 4;
    }
    if (s.tabela && s.tabela.linhas.length > 0) desenharTabela(s.tabela);
    else if (s.vazio && !(s.paragrafos && s.paragrafos.length)) {
      garantir(16);
      pagina.drawText(limparTexto(s.vazio), { x: M, y, size: 10, font: fonte, color: CINZA });
      y -= 16;
    }
    y -= 8;
  }

  const agora = new Date().toLocaleString('pt-BR', { timeZone: FUSO });
  const paginas = pdf.getPages();
  paginas.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 40 }, end: { x: LARG - M, y: 40 }, thickness: 0.5, color: LINHA });
    p.drawText(limparTexto(`${doc.rodape ?? 'Documento gerado pelo Ginkle'} · Gerado em ${agora}`), { x: M, y: 28, size: 7.5, font: fonte, color: CINZA });
    p.drawText(`Página ${i + 1} de ${paginas.length}`, { x: LARG - M - 62, y: 28, size: 7.5, font: fonte, color: CINZA });
  });

  return pdf.save();
}

export function respostaPdf(bytes: Uint8Array, nomeArquivo: string): Response {
  const seguro = nomeArquivo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').toLowerCase();
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${seguro}"`,
      'Cache-Control': 'no-store',
    },
  });
}
