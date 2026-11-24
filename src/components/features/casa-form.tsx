'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox, Input, Textarea } from '@/components/ui/form';
import { Alert } from '@/components/ui/feedback';
import { AddressFields, validarEndereco, type Endereco, type ErrosEndereco } from './address-fields';
import { ImageUpload } from './image-upload';
import { mensagemDeErro } from './formulario-generico';
import { formatarCNPJ, formatarTelefone, soDigitos } from '@/utils/formatters';
import { validarCNPJ, validarEmail, validarTelefone } from '@/utils/validators';

export interface CasaEdicao {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  telefone: string | null;
  email: string | null;
  site: string | null;
  descricao: string | null;
  cep: string;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string;
  uf: string;
  logo_url: string | null;
  capa_url: string | null;
  latitude?: number | null;
  publicada: boolean;
}

async function geocodificar(supabase: ReturnType<typeof createClient>, casaId: string, e: Endereco) {
  const consultas = [
    `${e.logradouro}, ${e.numero}, ${e.bairro}, ${e.cidade} - ${e.uf}, Brasil`,
    `${e.cep}, ${e.cidade} - ${e.uf}, Brasil`,
  ];
  for (const q of consultas) {
    const r = await fetch(`/api/geocodificar?q=${encodeURIComponent(q)}`).catch(() => null);
    if (r?.ok) {
      const { lat, lng } = (await r.json()) as { lat: number; lng: number };
      await supabase.from('ilpis').update({ latitude: lat, longitude: lng }).eq('id', casaId);
      return;
    }
  }
}

export function CasaForm({ casa }: { casa?: CasaEdicao }) {
  const router = useRouter();
  const editando = Boolean(casa);
  const [d, setD] = useState({
    nome: casa?.nome_fantasia ?? '',
    razao: casa?.razao_social ?? '',
    cnpj: casa ? formatarCNPJ(casa.cnpj) : '',
    telefone: casa?.telefone ? formatarTelefone(casa.telefone) : '',
    email: casa?.email ?? '',
    site: casa?.site ?? '',
    descricao: casa?.descricao ?? '',
    publicada: casa?.publicada ?? false,
  });
  const [end, setEnd] = useState<Endereco>({
    cep: casa?.cep ?? '', logradouro: casa?.logradouro ?? '', numero: casa?.numero ?? '', complemento: casa?.complemento ?? '',
    bairro: casa?.bairro ?? '', cidade: casa?.cidade ?? '', uf: casa?.uf ?? '',
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [errosEnd, setErrosEnd] = useState<ErrosEndereco>({});
  const [erroGeral, setErroGeral] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const set = (campo: keyof typeof d, valor: string | boolean) => {
    setD((x) => ({ ...x, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: '' }));
    setSucesso('');
  };

  async function salvar(ev: FormEvent) {
    ev.preventDefault();
    setErroGeral(''); setSucesso('');
    const e: Record<string, string> = {};
    if (d.nome.trim().length < 3) e.nome = 'Informe o nome da casa de repouso.';
    if (d.razao.trim().length < 3) e.razao = 'Informe a razão social.';
    if (!editando && !validarCNPJ(d.cnpj)) e.cnpj = 'CNPJ inválido.';
    if (d.telefone && !validarTelefone(d.telefone)) e.telefone = 'Telefone inválido. Informe o DDD.';
    if (d.email && !validarEmail(d.email)) e.email = 'E-mail inválido.';
    if (d.site && !/^https?:\/\/.+\..+/.test(d.site.trim())) e.site = 'Use o endereço completo, começando com https://';
    if (d.publicada && d.descricao.trim().length < 20) e.descricao = 'Para publicar, escreva uma descrição de pelo menos 20 caracteres.';
    const ee = validarEndereco(end);
    setErros(e); setErrosEnd(ee);
    if (Object.keys(e).length || Object.keys(ee).length) return;

    setEnviando(true);
    const supabase = createClient();

    if (!casa) {
      const { data, error } = await supabase.rpc('cadastrar_casa_repouso', {
        p_cnpj: soDigitos(d.cnpj), p_razao_social: d.razao.trim(), p_nome_fantasia: d.nome.trim(),
        p_cep: soDigitos(end.cep), p_logradouro: end.logradouro.trim(), p_numero: end.numero.trim(),
        p_cidade: end.cidade.trim(), p_uf: end.uf,
        p_telefone: soDigitos(d.telefone) || null, p_email: d.email.trim() || null, p_site: d.site.trim() || null,
        p_descricao: d.descricao.trim() || null, p_complemento: end.complemento.trim() || null, p_bairro: end.bairro.trim() || null,
      });
      setEnviando(false);
      if (error) { setErroGeral(mensagemDeErro(error)); return; }
      void geocodificar(supabase, String(data), end);
      document.cookie = `ginkle_casa=${data}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      router.push(`/gerente/casas/${data}/editar?novo=1`);
      router.refresh();
      return;
    }

    const { error } = await supabase.from('ilpis').update({
      nome_fantasia: d.nome.trim(), razao_social: d.razao.trim(),
      telefone: soDigitos(d.telefone) || null, email: d.email.trim() || null, site: d.site.trim() || null,
      descricao: d.descricao.trim() || null, publicada: d.publicada,
      cep: soDigitos(end.cep), logradouro: end.logradouro.trim(), numero: end.numero.trim(),
      complemento: end.complemento.trim() || null, bairro: end.bairro.trim() || null, cidade: end.cidade.trim(), uf: end.uf,
    }).eq('id', casa.id);
    setEnviando(false);
    if (error) { setErroGeral(mensagemDeErro(error)); return; }
    const enderecoMudou = [end.logradouro, end.numero, end.bairro, end.cidade, end.uf, end.cep].join('|') !== [casa.logradouro ?? '', casa.numero ?? '', casa.bairro ?? '', casa.cidade, casa.uf, casa.cep].join('|');
    if (enderecoMudou || casa.latitude == null) await geocodificar(supabase, casa.id, end);
    setSucesso('Dados da casa de repouso salvos.');
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {casa && (
        <section aria-labelledby="titulo-imagens" className="space-y-5">
          <h2 id="titulo-imagens" className="text-lg font-bold">Imagens</h2>
          <ImageUpload casaId={casa.id} tipo="logo" urlAtual={casa.logo_url} rotulo="Logotipo" ladoMax={512} proporcao="aspect-square max-w-40"
            dica="Quadrado, fundo transparente ou claro. Reduzimos e otimizamos automaticamente." />
          <ImageUpload casaId={casa.id} tipo="capa" urlAtual={casa.capa_url} rotulo="Foto de capa" ladoMax={1600} proporcao="aspect-[16/9]"
            dica="Foto da fachada ou de um ambiente (horizontal, 16:9). Reduzimos e otimizamos automaticamente." />
        </section>
      )}

      <form onSubmit={salvar} noValidate className="space-y-8">
        <section aria-labelledby="titulo-dados" className="space-y-4">
          <h2 id="titulo-dados" className="text-lg font-bold">Dados da casa de repouso</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input rotulo="Nome fantasia" required value={d.nome} onChange={(e) => set('nome', e.target.value)} erro={erros.nome} dica="Nome que as famílias vão ver." />
            <Input rotulo="Razão social" required value={d.razao} onChange={(e) => set('razao', e.target.value)} erro={erros.razao} />
            <Input rotulo="CNPJ" required inputMode="numeric" placeholder="00.000.000/0000-00" value={d.cnpj} disabled={editando}
              onChange={(e) => set('cnpj', formatarCNPJ(e.target.value))} erro={erros.cnpj} dica={editando ? 'O CNPJ não pode ser alterado.' : undefined} />
            <Input rotulo="Telefone" type="tel" inputMode="tel" placeholder="(13) 3333-4444" value={d.telefone} onChange={(e) => set('telefone', formatarTelefone(e.target.value))} erro={erros.telefone} />
            <Input rotulo="E-mail de contato" type="email" value={d.email} onChange={(e) => set('email', e.target.value)} erro={erros.email} />
            <Input rotulo="Site" type="url" placeholder="https://" value={d.site} onChange={(e) => set('site', e.target.value)} erro={erros.site} />
          </div>
          <Textarea rotulo="Descrição" maxLength={800} value={d.descricao} onChange={(e) => set('descricao', e.target.value)} erro={erros.descricao}
            dica="Conte sobre a estrutura, a equipe, as atividades e o modelo de cuidado. Aparece no diretório público." />
        </section>

        <section aria-labelledby="titulo-endereco" className="space-y-4">
          <h2 id="titulo-endereco" className="text-lg font-bold">Endereço</h2>
          <AddressFields valor={end} aoMudar={(e) => { setEnd(e); setErrosEnd({}); setSucesso(''); }} erros={errosEnd} />
        </section>

        {editando && (
          <section aria-labelledby="titulo-pub" className="space-y-2">
            <h2 id="titulo-pub" className="text-lg font-bold">Visibilidade</h2>
            <Checkbox rotulo="Exibir esta casa de repouso no diretório público" checked={d.publicada} onChange={(e) => set('publicada', e.target.checked)} />
            <p className="text-sm text-muted">Quando publicada, qualquer pessoa pode ver nome, endereço, contato e descrição. Dados de residentes nunca são públicos.</p>
          </section>
        )}

        {erroGeral && <Alert tipo="erro">{erroGeral}</Alert>}
        {sucesso && <Alert tipo="sucesso">{sucesso}</Alert>}
        <Button type="submit" tamanho="lg" carregando={enviando} className="w-full sm:w-auto">
          {editando ? 'Salvar alterações' : 'Cadastrar casa de repouso'}
        </Button>
      </form>
    </div>
  );
}
