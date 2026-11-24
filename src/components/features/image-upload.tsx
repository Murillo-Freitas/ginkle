'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ImagePlus } from 'lucide-react';
import { useId, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Alert } from '@/components/ui/feedback';
import { estiloRotulo } from '@/components/ui/estilos';
import { cn } from '@/lib/cn';

async function paraWebp(arquivo: File, ladoMax: number): Promise<Blob> {
  const bmp = await createImageBitmap(arquivo);
  const escala = Math.min(1, ladoMax / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * escala);
  const h = Math.round(bmp.height * escala);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  return new Promise((ok, falha) =>
    canvas.toBlob((b) => (b ? ok(b) : falha(new Error('Não foi possível converter a imagem.'))), 'image/webp', 0.8),
  );
}

/** Envia a imagem já reduzida e convertida para WebP (menos peso = carregamento mais rápido). */
export function ImageUpload({ casaId, tipo, urlAtual, rotulo, dica, ladoMax, proporcao }: {
  casaId: string; tipo: 'logo' | 'capa'; urlAtual: string | null; rotulo: string; dica: string; ladoMax: number; proporcao: string;
}) {
  const router = useRouter();
  const id = useId();
  const [url, setUrl] = useState(urlAtual);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function aoEscolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro('');
    if (!arquivo.type.startsWith('image/')) { setErro('Escolha um arquivo de imagem (JPG, PNG ou WebP).'); return; }
    if (arquivo.size > 20 * 1024 * 1024) { setErro('A imagem é grande demais. Use um arquivo de até 20 MB.'); return; }

    setEnviando(true);
    try {
      const supabase = createClient();
      const blob = await paraWebp(arquivo, ladoMax);
      const caminho = `${casaId}/${tipo}-${Date.now()}.webp`;
      const { error: erroEnvio } = await supabase.storage.from('casas').upload(caminho, blob, {
        contentType: 'image/webp', cacheControl: '31536000',
      });
      if (erroEnvio) throw new Error(erroEnvio.message);

      const novaUrl = supabase.storage.from('casas').getPublicUrl(caminho).data.publicUrl;
      const { error: erroBanco } = await supabase.from('ilpis').update({ [`${tipo}_url`]: novaUrl }).eq('id', casaId);
      if (erroBanco) throw new Error(erroBanco.message);

      const antigo = url?.split('/object/public/casas/')[1];
      if (antigo) await supabase.storage.from('casas').remove([antigo]);

      setUrl(novaUrl);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível enviar a imagem.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <label htmlFor={id} className={estiloRotulo}>{rotulo}</label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className={cn('relative w-full max-w-xs overflow-hidden rounded-lg border border-line bg-surface-alt', proporcao)}>
          {url ? (
            <Image src={url} alt="" fill sizes="320px" className={tipo === 'logo' ? 'object-contain p-2' : 'object-cover'} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted"><ImagePlus aria-hidden className="size-8" /></div>
          )}
        </div>
        <div>
          <input
            id={id} type="file" accept="image/*" disabled={enviando}
            onChange={(e) => aoEscolher(e.target.files?.[0])}
            className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:font-semibold file:text-on-primary hover:file:bg-primary-hover"
          />
          <p className="mt-1.5 text-sm text-muted">{enviando ? 'Enviando e otimizando…' : dica}</p>
        </div>
      </div>
      {erro && <div className="mt-2"><Alert tipo="erro">{erro}</Alert></div>}
    </div>
  );
}
