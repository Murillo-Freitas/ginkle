'use client';

import { FileText, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { Alert, Badge } from '@/components/ui/feedback';
import { mensagemDeErro } from './formulario-generico';
import { formatarData } from '@/utils/formatters';

export interface DocumentoLinha { id: string; tipo: string; nome_arquivo: string; caminho: string; status: string; criado_em: string }

const TIPOS: Record<string, string> = { ALVARA: 'Alvará de funcionamento', LICENCA_SANITARIA: 'Licença sanitária', CNPJ: 'Cartão CNPJ', OUTRO: 'Outro documento' };
const TOM = { PENDENTE: 'aviso', APROVADO: 'ok', REJEITADO: 'perigo' } as const;
const ROTULO = { PENDENTE: 'Em análise', APROVADO: 'Aprovado', REJEITADO: 'Rejeitado' } as const;

/** Envio de PDFs (alvará e licenças) para o bucket privado. A conferência é feita pela equipe do Ginkle. */
export function DocumentosCasa({ casaId, documentos }: { casaId: string; documentos: DocumentoLinha[] }) {
  const router = useRouter();
  const [tipo, setTipo] = useState('ALVARA');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setErro('');
    if (!arquivo) { setErro('Escolha um arquivo PDF.'); return; }
    if (arquivo.type !== 'application/pdf') { setErro('Somente arquivos PDF são aceitos.'); return; }
    if (arquivo.size > 5 * 1024 * 1024) { setErro('O PDF deve ter no máximo 5 MB.'); return; }

    setEnviando(true);
    const supabase = createClient();
    const nomeSeguro = arquivo.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-80);
    const caminho = `${casaId}/${Date.now()}-${nomeSeguro}`;
    const { error: e1 } = await supabase.storage.from('documentos').upload(caminho, arquivo, { contentType: 'application/pdf' });
    if (e1) { setEnviando(false); setErro(e1.message); return; }
    const { error: e2 } = await supabase.from('documentos_ilpi').insert({ ilpi_id: casaId, tipo, nome_arquivo: arquivo.name.slice(0, 150), caminho });
    setEnviando(false);
    if (e2) { setErro(mensagemDeErro(e2)); return; }
    setArquivo(null);
    router.refresh();
  }

  async function baixar(d: DocumentoLinha) {
    const { data, error } = await createClient().storage.from('documentos').createSignedUrl(d.caminho, 60);
    if (error || !data) { setErro('Não foi possível abrir o documento.'); return; }
    window.open(data.signedUrl, '_blank', 'noopener');
  }

  async function remover(d: DocumentoLinha) {
    if (!window.confirm(`Remover "${d.nome_arquivo}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('documentos_ilpi').delete().eq('id', d.id);
    if (error) { setErro(mensagemDeErro(error)); return; }
    await supabase.storage.from('documentos').remove([d.caminho]);
    router.refresh();
  }

  return (
    <section aria-labelledby="titulo-docs" className="space-y-4">
      <div>
        <h2 id="titulo-docs" className="text-lg font-bold">Documentos da casa</h2>
        <p className="text-sm text-muted">Envie o alvará e as licenças em PDF (até 5 MB). Eles ficam em área privada e servem para a verificação da casa.</p>
      </div>
      {documentos.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {documentos.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileText aria-hidden className="size-5 shrink-0 text-accent" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{d.nome_arquivo}</p>
                  <p className="text-sm text-muted">{TIPOS[d.tipo] ?? d.tipo} · enviado em {formatarData(d.criado_em)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tom={TOM[d.status as keyof typeof TOM] ?? 'neutro'}>{ROTULO[d.status as keyof typeof ROTULO] ?? d.status}</Badge>
                <Button tamanho="sm" variante="contorno" onClick={() => baixar(d)}>Abrir</Button>
                {d.status === 'PENDENTE' && <Button tamanho="sm" variante="contorno" onClick={() => remover(d)}>Remover</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-[14rem_1fr_auto] sm:items-end" noValidate>
        <Select rotulo="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {Object.entries(TIPOS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
        </Select>
        <Input rotulo="Arquivo PDF" type="file" accept="application/pdf" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        <Button type="submit" carregando={enviando}><Upload aria-hidden className="size-4" /> Enviar</Button>
      </form>
      {erro && <Alert tipo="erro">{erro}</Alert>}
    </section>
  );
}
