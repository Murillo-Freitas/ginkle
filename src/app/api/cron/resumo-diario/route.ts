import { NextResponse, type NextRequest } from 'next/server';
import { criarAdmin } from '@/lib/admin';
import { enviarEmail, escaparHtml } from '@/lib/email';
import { TIPOS_REGISTRO } from '@/utils/constants';
import { formatarHora } from '@/utils/formatters';

interface Reg { residente_id: string; tipo: keyof typeof TIPOS_REGISTRO; titulo: string; urgente: boolean; criado_em_dispositivo: string; autor_nome: string }

/** Resumo diário por e-mail (agendado em vercel.json). Só envia para quem ativou "resumo diário" em Minha conta. */
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: 'nao-autorizado' }, { status: 401 });
  }
  const admin = criarAdmin();
  if (!admin) return NextResponse.json({ erro: 'servico-nao-configurado' }, { status: 500 });

  const { data: prefs, error: erroPrefs } = await admin
    .from('preferencias_notificacao').select('usuario_id').eq('resumo_diario', true).limit(500);
  if (erroPrefs) {
    console.error('[cron-resumo] Falha ao consultar preferências:', erroPrefs);
    return NextResponse.json({ erro: 'falha-ao-consultar-preferencias' }, { status: 500 });
  }

  const diagnostico = {
    preferencias_ativas: prefs?.length ?? 0,
    usuarios_encontrados: 0,
    usuarios_sem_email: 0,
    sem_vinculo_familiar: 0,
    sem_registros_24h: 0,
    falhas_consulta: 0,
    falhas_envio: 0,
  };
  const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const base = (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(/\/+$/, '');
  let enviados = 0;

  for (const p of (prefs ?? []) as { usuario_id: string }[]) {
    const { data: u, error: erroUsuario } = await admin
      .from('usuarios').select('nome_completo, email').eq('id', p.usuario_id).maybeSingle();
    if (erroUsuario) {
      diagnostico.falhas_consulta++;
      console.error('[cron-resumo] Falha ao consultar usuário:', erroUsuario);
      continue;
    }
    const usuario = u as { nome_completo: string; email: string | null } | null;
    if (!usuario) {
      diagnostico.falhas_consulta++;
      continue;
    }
    diagnostico.usuarios_encontrados++;
    if (!usuario.email) {
      diagnostico.usuarios_sem_email++;
      continue;
    }

    const { data: fam, error: erroFamiliares } = await admin
      .from('familiares_residentes')
      .select('residente:residentes(id, nome_completo)')
      .eq('usuario_id', p.usuario_id);
    if (erroFamiliares) {
      diagnostico.falhas_consulta++;
      console.error('[cron-resumo] Falha ao consultar vínculos familiares:', erroFamiliares);
      continue;
    }
    const residentes = ((fam ?? []) as unknown as { residente: { id: string; nome_completo: string } | null }[])
      .map((f) => f.residente)
      .filter((r): r is { id: string; nome_completo: string } => Boolean(r));
    if (residentes.length === 0) {
      diagnostico.sem_vinculo_familiar++;
      continue;
    }

    const { data: regs, error: erroRegistros } = await admin
      .from('registros_assistenciais')
      .select('residente_id, tipo, titulo, urgente, criado_em_dispositivo, autor_nome')
      .in('residente_id', residentes.map((r) => r.id))
      .gte('criado_em_dispositivo', desde)
      .order('criado_em_dispositivo', { ascending: true });
    if (erroRegistros) {
      diagnostico.falhas_consulta++;
      console.error('[cron-resumo] Falha ao consultar registros assistenciais:', erroRegistros);
      continue;
    }
    const lista = (regs ?? []) as Reg[];
    if (lista.length === 0) {
      diagnostico.sem_registros_24h++;
      continue;
    }

    const blocosHtml: string[] = [];
    const blocosTexto: string[] = [];
    for (const r of residentes) {
      const dele = lista.filter((x) => x.residente_id === r.id);
      if (dele.length === 0) continue;
      const itens = dele.map((x) => `${formatarHora(x.criado_em_dispositivo)} · ${TIPOS_REGISTRO[x.tipo] ?? x.tipo}${x.urgente ? ' (URGENTE)' : ''}: ${x.titulo}`);
      blocosHtml.push(`<h3 style="color:#2A532C;margin:20px 0 6px">${escaparHtml(r.nome_completo)}</h3><ul style="padding-left:18px;margin:0">${itens.map((i) => `<li>${escaparHtml(i)}</li>`).join('')}</ul>`);
      blocosTexto.push(`${r.nome_completo}\n${itens.map((i) => `- ${i}`).join('\n')}`);
    }

    const primeiroNome = usuario.nome_completo.trim().split(/\s+/)[0] || 'Olá';
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1F10">
      <h2 style="color:#2A532C;margin:0 0 8px">Resumo do dia no Ginkle</h2>
      <p>Olá, ${escaparHtml(primeiroNome)}. Veja o que foi registrado nas últimas 24 horas:</p>
      ${blocosHtml.join('')}
      <p style="margin-top:24px"><a href="${base}/cliente/dashboard" style="background:#2A532C;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Abrir o Ginkle</a></p>
      <p style="font-size:12px;color:#4B6150">Para parar de receber este resumo, desative-o em Minha conta &gt; Notificações.</p></div>`;
    const texto = `Resumo do dia no Ginkle\n\n${blocosTexto.join('\n\n')}\n\nAbrir: ${base}/cliente/dashboard`;

    if (await enviarEmail({ para: usuario.email, assunto: 'Resumo do dia no Ginkle', html, texto })) enviados++;
    else diagnostico.falhas_envio++;
  }

  return NextResponse.json({ enviados, ...diagnostico });
}
