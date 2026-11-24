import { NextResponse } from 'next/server';

/** O middleware renova o cookie de atividade (controle de inatividade) a cada chamada. */
export async function POST() {
  return NextResponse.json({ ok: true });
}
