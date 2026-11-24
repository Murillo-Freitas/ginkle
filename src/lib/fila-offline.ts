import { createClient } from '@/lib/supabase/client';

export interface RegistroPendente {
  chave: string;
  payload: Record<string, unknown>;
  criadoEm: string;
}

const nomeFila = (uid: string) => `ginkle-fila-${uid}`;
const nomeFalhas = (uid: string) => `ginkle-fila-falhas-${uid}`;
export const EVENTO_FILA = 'ginkle-fila-mudou';

function ler(nome: string): RegistroPendente[] {
  try {
    return JSON.parse(localStorage.getItem(nome) ?? '[]') as RegistroPendente[];
  } catch {
    return [];
  }
}
function gravar(nome: string, lista: RegistroPendente[]) {
  try {
    localStorage.setItem(nome, JSON.stringify(lista));
    window.dispatchEvent(new Event(EVENTO_FILA));
  } catch {
    /* armazenamento cheio ou bloqueado */
  }
}

export const lerFila = (uid: string) => ler(nomeFila(uid));
export const lerFalhas = (uid: string) => ler(nomeFalhas(uid));

export function enfileirar(uid: string, payload: Record<string, unknown>) {
  const chave = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  gravar(nomeFila(uid), [...lerFila(uid), { chave, payload, criadoEm: new Date().toISOString() }]);
}

export const parecemErroDeRede = (mensagem: string) => /fetch|network|failed to|load failed|offline/i.test(mensagem);

/** Envia os registros guardados no aparelho, na ordem em que foram feitos. */
export async function sincronizarFila(uid: string): Promise<{ enviados: number; restantes: number; rejeitados: number }> {
  const supabase = createClient();
  let fila = lerFila(uid);
  let enviados = 0;
  let rejeitados = 0;

  for (const item of [...fila]) {
    const { error } = await supabase.from('registros_assistenciais').insert(item.payload);
    if (error && (parecemErroDeRede(error.message) || !navigator.onLine)) break; // sem conexão: tenta depois
    fila = fila.filter((x) => x.chave !== item.chave);
    if (error) {
      // o servidor recusou o registro: guarda à parte para não travar a fila
      gravar(nomeFalhas(uid), [...lerFalhas(uid), { ...item, payload: { ...item.payload, erro: error.message } }]);
      rejeitados++;
    } else {
      enviados++;
    }
    gravar(nomeFila(uid), fila);
  }
  return { enviados, restantes: fila.length, rejeitados };
}
