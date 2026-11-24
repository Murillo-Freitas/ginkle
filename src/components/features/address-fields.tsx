'use client';

import { useEffect, useRef, useState } from 'react';
import { Input, Select } from '@/components/ui/form';
import { formatarCEP, soDigitos } from '@/utils/formatters';
import { UFS } from '@/utils/constants';

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export const enderecoVazio: Endereco = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };
export type ErrosEndereco = Partial<Record<keyof Endereco, string>>;

/** Valida os campos mínimos do endereço. */
export function validarEndereco(e: Endereco): ErrosEndereco {
  const erros: ErrosEndereco = {};
  if (soDigitos(e.cep).length !== 8) erros.cep = 'Informe um CEP com 8 dígitos.';
  if (!e.logradouro.trim()) erros.logradouro = 'Informe a rua ou avenida.';
  if (!e.numero.trim()) erros.numero = 'Informe o número (ou S/N).';
  if (!e.cidade.trim()) erros.cidade = 'Informe a cidade.';
  if (!e.uf) erros.uf = 'Selecione o estado.';
  return erros;
}

/** Campos de endereço com preenchimento automático pelo CEP (ViaCEP). */
export function AddressFields({ valor, aoMudar, erros = {} }: {
  valor: Endereco; aoMudar: (e: Endereco) => void; erros?: ErrosEndereco;
}) {
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState('');
  const atual = useRef(valor);
  const numeroRef = useRef<HTMLInputElement>(null);
  const ultimoBuscado = useRef('');

  useEffect(() => { atual.current = valor; }, [valor]);

  async function buscarCep(cep: string) {
    if (ultimoBuscado.current === cep) return;
    ultimoBuscado.current = cep;
    setBuscando(true);
    setAviso('');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: ctrl.signal });
      const d = await r.json();
      if (d.erro) {
        setAviso('CEP não encontrado. Preencha o endereço manualmente.');
      } else {
        aoMudar({
          ...atual.current,
          cep: formatarCEP(cep),
          logradouro: d.logradouro || atual.current.logradouro,
          bairro: d.bairro || atual.current.bairro,
          cidade: d.localidade || atual.current.cidade,
          uf: d.uf || atual.current.uf,
        });
        numeroRef.current?.focus();
      }
    } catch {
      setAviso('Não foi possível consultar o CEP agora. Preencha o endereço manualmente.');
    } finally {
      clearTimeout(timer);
      setBuscando(false);
    }
  }

  function mudar(campo: keyof Endereco, v: string) {
    aoMudar({ ...valor, [campo]: v });
  }

  function mudarCep(v: string) {
    const formatado = formatarCEP(v);
    mudar('cep', formatado);
    const d = soDigitos(formatado);
    if (d.length < 8) ultimoBuscado.current = '';
    if (d.length === 8) void buscarCep(d);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <div className="sm:col-span-2">
        <Input
          rotulo="CEP" required inputMode="numeric" autoComplete="postal-code" placeholder="00000-000"
          value={valor.cep} onChange={(e) => mudarCep(e.target.value)} erro={erros.cep}
          dica={buscando ? 'Buscando endereço…' : aviso || undefined}
        />
      </div>
      <div className="sm:col-span-4">
        <Input rotulo="Rua ou avenida" required autoComplete="address-line1" value={valor.logradouro} onChange={(e) => mudar('logradouro', e.target.value)} erro={erros.logradouro} />
      </div>
      <div className="sm:col-span-2">
        <Input ref={numeroRef} rotulo="Número" required value={valor.numero} onChange={(e) => mudar('numero', e.target.value)} erro={erros.numero} />
      </div>
      <div className="sm:col-span-4">
        <Input rotulo="Complemento" autoComplete="address-line2" placeholder="Apto, bloco, referência (opcional)" value={valor.complemento} onChange={(e) => mudar('complemento', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Input rotulo="Bairro" value={valor.bairro} onChange={(e) => mudar('bairro', e.target.value)} />
      </div>
      <div className="sm:col-span-3">
        <Input rotulo="Cidade" required autoComplete="address-level2" value={valor.cidade} onChange={(e) => mudar('cidade', e.target.value)} erro={erros.cidade} />
      </div>
      <div className="sm:col-span-1">
        <Select rotulo="UF" required autoComplete="address-level1" value={valor.uf} onChange={(e) => mudar('uf', e.target.value)} erro={erros.uf}>
          <option value="">UF</option>
          {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
        </Select>
      </div>
    </div>
  );
}
