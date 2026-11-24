import type { NextRequest } from 'next/server';
import { getSessao } from '@/lib/auth';
import { gerarPdf, respostaPdf } from '@/lib/pdf';
import { createClient } from '@/lib/supabase/server';
import { enderecoEmLinha, formatarCEP, formatarCNPJ, formatarCompetencia, formatarData, formatarDataHora, formatarMoeda } from '@/utils/formatters';
import { valorPorExtenso } from '@/utils/extenso';
import { ehUUID } from '@/utils/validators';

interface Mens {
  id: string; residente_id: string; competencia: string; valor: number; status: string; data_pagamento: string | null;
  forma_pagamento: string | null; numero_recibo: number | null; recibo_emitido_em: string | null;
  residente: { nome_completo: string } | null;
  ilpi: { razao_social: string; nome_fantasia: string; cnpj: string; logradouro: string | null; numero: string | null; bairro: string | null; cidade: string; uf: string; cep: string } | null;
}

/** Recibo da mensalidade paga. Só quem tem acesso financeiro (gestor ou responsável financeiro) consegue gerar. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessao())) return new Response('Faça login para baixar o recibo.', { status: 401 });
  const { id } = await params;
  if (!ehUUID(id)) return new Response('Recibo não encontrado.', { status: 404 });

  const supabase = await createClient();
  const { data } = await supabase
    .from('mensalidades')
    .select('id, residente_id, competencia, valor, status, data_pagamento, forma_pagamento, numero_recibo, recibo_emitido_em, residente:residentes(nome_completo), ilpi:ilpis(razao_social, nome_fantasia, cnpj, logradouro, numero, bairro, cidade, uf, cep)')
    .eq('id', id)
    .maybeSingle();
  const m = data as unknown as Mens | null;
  if (!m || !m.ilpi) return new Response('Recibo não encontrado ou sem permissão.', { status: 404 });
  if (m.status !== 'PAGA' || !m.numero_recibo) return new Response('O recibo só é emitido depois da baixa do pagamento pela casa de repouso.', { status: 409 });

  const { data: pag } = await supabase
    .from('familiares_residentes')
    .select('usuario:usuarios(nome_completo, cpf)')
    .eq('residente_id', m.residente_id)
    .eq('responsavel_financeiro', true)
    .limit(1);
  const pagador = (pag as unknown as { usuario: { nome_completo: string; cpf: string } | null }[] | null)?.[0]?.usuario;
  const quem = pagador ? `${pagador.nome_completo} (CPF ${pagador.cpf.slice(0, 3)}.***.***-${pagador.cpf.slice(9)})` : `o responsável pelo(a) residente ${m.residente?.nome_completo ?? ''}`;
  const numero = String(m.numero_recibo).padStart(6, '0');
  const valor = Number(m.valor);

  const bytes = await gerarPdf({
    titulo: `Recibo nº ${numero}`,
    subtitulo: `${m.ilpi.razao_social} · CNPJ ${formatarCNPJ(m.ilpi.cnpj)}`,
    secoes: [
      {
        titulo: 'Recibo',
        paragrafos: [
          `Recebemos de ${quem} a importância de ${formatarMoeda(valor)} (${valorPorExtenso(valor)}), referente à mensalidade de ${formatarCompetencia(m.competencia)} do(a) residente ${m.residente?.nome_completo ?? ''}, paga em ${formatarData(m.data_pagamento)}${m.forma_pagamento ? ` por ${m.forma_pagamento}` : ''}.`,
        ],
      },
      {
        titulo: 'Emitente',
        paragrafos: [`${m.ilpi.razao_social} (${m.ilpi.nome_fantasia})`, `CNPJ ${formatarCNPJ(m.ilpi.cnpj)}`, `${enderecoEmLinha(m.ilpi)} · CEP ${formatarCEP(m.ilpi.cep)}`],
      },
      {
        titulo: 'Autenticidade',
        paragrafos: [
          `Recibo nº ${numero}, emitido eletronicamente pelo Ginkle${m.recibo_emitido_em ? ` em ${formatarDataHora(m.recibo_emitido_em)}` : ''}, a partir da baixa de pagamento registrada pela casa de repouso. A numeração é sequencial e rastreável no sistema.`,
          'Este documento comprova o pagamento informado pela casa de repouso e não substitui nota fiscal.',
        ],
      },
    ],
    rodape: `Recibo nº ${numero} · Ginkle`,
  });
  return respostaPdf(bytes, `recibo-${numero}.pdf`);
}
