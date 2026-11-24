import Link from 'next/link';
import { classesBotao } from '@/components/ui/button';
import { estiloCampo, estiloRotulo } from '@/components/ui/estilos';
import { PERIODOS, TIPOS_REGISTRO } from '@/utils/constants';

/** Filtros por GET: funcionam sem JavaScript e deixam a URL compartilhável. */
export function FiltrosRegistros({ caminho, valores, residentes, mostrarTipo = true, mostrarAutor = false, ocultos }: {
  caminho: string;
  valores: { periodo: string; tipo: string; residente: string; autor: string };
  residentes?: { id: string; nome: string }[];
  mostrarTipo?: boolean;
  mostrarAutor?: boolean;
  ocultos?: Record<string, string>;
}) {
  return (
    <form method="get" action={caminho} className="mb-5 rounded-xl border border-line bg-surface p-4">
      {ocultos && Object.entries(ocultos).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="f-periodo" className={estiloRotulo}>Período</label>
          <select id="f-periodo" name="periodo" defaultValue={valores.periodo} className={estiloCampo}>
            {PERIODOS.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
          </select>
        </div>
        {mostrarTipo && (
          <div>
            <label htmlFor="f-tipo" className={estiloRotulo}>Tipo de registro</label>
            <select id="f-tipo" name="tipo" defaultValue={valores.tipo} className={estiloCampo}>
              <option value="">Todos</option>
              {Object.entries(TIPOS_REGISTRO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </div>
        )}
        {residentes && (
          <div>
            <label htmlFor="f-residente" className={estiloRotulo}>Residente</label>
            <select id="f-residente" name="residente" defaultValue={valores.residente} className={estiloCampo}>
              <option value="">Todos</option>
              {residentes.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </div>
        )}
        {mostrarAutor && (
          <div>
            <label htmlFor="f-autor" className={estiloRotulo}>Autoria</label>
            <select id="f-autor" name="autor" defaultValue={valores.autor} className={estiloCampo}>
              <option value="">Toda a equipe</option>
              <option value="eu">Somente os meus</option>
            </select>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" className={classesBotao('primario', 'md')}>Aplicar filtros</button>
        <Link href={caminho + (ocultos ? `?${new URLSearchParams(ocultos).toString()}` : '')} className={classesBotao('contorno', 'md')}>Limpar</Link>
      </div>
    </form>
  );
}
