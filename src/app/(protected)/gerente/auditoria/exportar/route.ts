import { NextResponse, type NextRequest } from 'next/server';
import { getCasaGestor } from '@/lib/auth';
import { ACOES, consultarLogs, ENTIDADES } from '@/lib/auditoria';
import { gerarPdf, respostaPdf } from '@/lib/pdf';
import { createClient } from '@/lib/supabase/server';
import { PERIODOS } from '@/utils/constants';
import { formatarDataHora, hojeISO } from '@/utils/formatters';

const celula = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;

/** Exporta o histórico filtrado em CSV ou PDF (até 1.000 linhas por exportação). */
export async function GET(request: NextRequest) {
  const { casa } = await getCasaGestor();
  if (!casa) return new NextResponse('Acesso negado.', { status: 403 });

  const sp = request.nextUrl.searchParams;
  const periodo = sp.get('periodo') ?? '30d';
  const { itens } = await consultarLogs(await createClient(), {
    ilpiId: casa.id, periodo, entidade: sp.get('entidade') ?? undefined,
    acao: sp.get('acao') ?? undefined, pagina: 1, limite: 1000,
  });

  const linhas = itens.map((l) => [
    formatarDataHora(l.sincronizado_em_servidor), l.usuario_nome ?? 'Sistema', ACOES[l.acao] ?? l.acao, ENTIDADES[l.entidade] ?? l.entidade, l.resumo ?? '',
  ]);

  if (sp.get('formato') === 'pdf') {
    const rotulo = PERIODOS.find((p) => p.valor === periodo)?.rotulo ?? periodo;
    const bytes = await gerarPdf({
      titulo: 'Histórico de ações',
      subtitulo: `${casa.nome_fantasia} · Período: ${rotulo} · ${itens.length} ação(ões). Os registros de auditoria não podem ser alterados nem apagados.`,
      secoes: [{
        vazio: 'Nenhuma ação encontrada neste filtro.',
        tabela: {
          colunas: [{ titulo: 'Data e hora', largura: 0.18 }, { titulo: 'Usuário', largura: 0.2 }, { titulo: 'Ação', largura: 0.2 }, { titulo: 'Registro', largura: 0.17 }, { titulo: 'Detalhe', largura: 0.25 }],
          linhas,
        },
      }],
      rodape: 'Histórico de ações · Ginkle',
    });
    return respostaPdf(bytes, `historico-de-acoes-${hojeISO()}.pdf`);
  }

  const csv = [['Data e hora', 'Usuário', 'Ação', 'Registro', 'Detalhe'].map(celula).join(';'), ...linhas.map((l) => l.map(celula).join(';'))];
  return new NextResponse('\uFEFF' + csv.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="historico-de-acoes-${hojeISO()}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
