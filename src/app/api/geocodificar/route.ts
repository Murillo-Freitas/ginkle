import { NextResponse, type NextRequest } from 'next/server';
import { getSessao } from '@/lib/auth';

/** Converte um endereço em latitude/longitude usando o OpenStreetMap (Nominatim). Uso leve: só ao salvar a casa. */
export async function GET(request: NextRequest) {
  if (!(await getSessao())) return NextResponse.json({ erro: 'sessao' }, { status: 401 });
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 5 || q.length > 200) return NextResponse.json({ erro: 'dados' }, { status: 400 });

  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'Ginkle-TCC/1.0 (projeto academico ETEC Praia Grande)', 'Accept-Language': 'pt-BR' },
      signal: AbortSignal.timeout(8000),
    });
    const lista = (await r.json()) as { lat: string; lon: string }[];
    if (!Array.isArray(lista) || lista.length === 0) return NextResponse.json({ erro: 'nao-encontrado' }, { status: 404 });
    return NextResponse.json({ lat: Number(lista[0].lat), lng: Number(lista[0].lon) });
  } catch {
    return NextResponse.json({ erro: 'indisponivel' }, { status: 502 });
  }
}
