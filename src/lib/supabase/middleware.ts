import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Perfil } from '@/types';
import { CHAVE_PUBLICA } from './chave';

type CookieParaGravar = { name: string; value: string; options: CookieOptions };

const ROTAS_PROTEGIDAS = ['/cliente', '/funcionario', '/gerente', '/minha-conta', '/cadastrar-casa', '/relatorios'];
const LIMITE_INATIVIDADE_MS = 90 * 60 * 1000; // sessão expira após 90 minutos sem atividade
const ROTAS_AUTENTICACAO = ['/login', '/cadastro', '/esqueci-senha'];
const AREA_POR_PERFIL: [string, Perfil][] = [
  ['/gerente', 'GERENTE'],
  ['/funcionario', 'FUNCIONARIO'],
  ['/cliente', 'CLIENTE'],
];

const comecaCom = (caminho: string, bases: string[]) =>
  bases.some((b) => caminho === b || caminho.startsWith(b + '/'));

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    CHAVE_PUBLICA,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieParaGravar[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getUser() valida o token no servidor do Supabase (não confie em getSession aqui).
  const { data: { user } } = await supabase.auth.getUser();
  const caminho = request.nextUrl.pathname;

  const redirecionar = (destino: string, comNext = false) => {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    url.search = '';
    if (comNext) url.searchParams.set('next', caminho);
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (!user) {
    // sem sessão: apaga o cookie de atividade antigo para não expirar o próximo login
    if (request.cookies.get('ginkle_ultimo')) response.cookies.delete('ginkle_ultimo');
    if (comecaCom(caminho, ROTAS_PROTEGIDAS)) return redirecionar('/login', true);
    return response;
  }

  // Perfis ficam em app_metadata (só o servidor altera), sincronizados por trigger a partir de public.usuarios.
  // Expiração por inatividade: o cookie guarda o último acesso (pré-carregamentos automáticos não contam).
  const ultimo = Number(request.cookies.get('ginkle_ultimo')?.value ?? 0);
  if (ultimo && Date.now() - ultimo > LIMITE_INATIVIDADE_MS) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '?aviso=sessao_expirada';
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    r.cookies.delete('ginkle_ultimo');
    return r;
  }
  const preCarregamento = request.headers.get('next-router-prefetch') || request.headers.get('purpose') === 'prefetch';
  if (!preCarregamento) {
    response.cookies.set('ginkle_ultimo', String(Date.now()), { path: '/', sameSite: 'lax', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
  }

  const perfis: Perfil[] = Array.isArray(user.app_metadata?.perfis) ? user.app_metadata.perfis : ['CLIENTE'];

  if (comecaCom(caminho, ROTAS_AUTENTICACAO)) return redirecionar('/cliente/dashboard');

  for (const [prefixo, perfil] of AREA_POR_PERFIL) {
    if (comecaCom(caminho, [prefixo])) {
      if (!perfis.includes(perfil)) return redirecionar('/cliente/dashboard');
      response.cookies.set('ginkle_perfil', perfil, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
      break;
    }
  }

  return response;
}
