'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { Alert } from '@/components/ui/feedback';
import { AddressFields, validarEndereco, type Endereco, type ErrosEndereco } from './address-fields';
import { mensagemDeErro } from './formulario-generico';
import { formatarCPF, formatarTelefone, soDigitos } from '@/utils/formatters';
import { validarTelefone } from '@/utils/validators';
import type { Usuario } from '@/types';

export function PerfilForm({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const [nome, setNome] = useState(usuario.nome_completo);
  const [telefone, setTelefone] = useState(formatarTelefone(usuario.telefone));
  const [nascimento, setNascimento] = useState(usuario.data_nascimento);
  const [end, setEnd] = useState<Endereco>({
    cep: usuario.cep ?? '', logradouro: usuario.logradouro ?? '', numero: usuario.numero ?? '', complemento: usuario.complemento ?? '',
    bairro: usuario.bairro ?? '', cidade: usuario.cidade ?? '', uf: usuario.uf ?? '',
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [errosEnd, setErrosEnd] = useState<ErrosEndereco>({});
  const [erroGeral, setErroGeral] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function salvar(ev: FormEvent) {
    ev.preventDefault();
    setErroGeral(''); setSucesso('');
    const e: Record<string, string> = {};
    if (nome.trim().split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome.';
    if (!validarTelefone(telefone)) e.telefone = 'Telefone inválido. Informe o DDD.';
    if (!nascimento) e.nascimento = 'Informe a data de nascimento.';
    const ee = validarEndereco(end);
    setErros(e); setErrosEnd(ee);
    if (Object.keys(e).length || Object.keys(ee).length) return;

    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.from('usuarios').update({
      nome_completo: nome.trim(), telefone: soDigitos(telefone), data_nascimento: nascimento,
      cep: soDigitos(end.cep), logradouro: end.logradouro.trim(), numero: end.numero.trim(),
      complemento: end.complemento.trim() || null, bairro: end.bairro.trim() || null, cidade: end.cidade.trim(), uf: end.uf,
    }).eq('id', usuario.id);
    if (!error) await supabase.auth.updateUser({ data: { nome_completo: nome.trim() } });
    setEnviando(false);
    if (error) { setErroGeral(mensagemDeErro(error)); return; }
    setSucesso('Dados atualizados.');
    router.refresh();
  }

  return (
    <form onSubmit={salvar} noValidate className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input rotulo="Nome completo" required value={nome} onChange={(e) => setNome(e.target.value)} erro={erros.nome} /></div>
        <Input rotulo="E-mail" value={usuario.email} disabled dica="O e-mail é usado para entrar e não pode ser alterado aqui." />
        <Input rotulo="CPF" value={formatarCPF(usuario.cpf)} disabled />
        <Input rotulo="Telefone" required type="tel" inputMode="tel" value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))} erro={erros.telefone} />
        <Input rotulo="Data de nascimento" required type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} erro={erros.nascimento} />
      </div>
      <div>
        <h3 className="mb-3 text-lg font-bold">Endereço</h3>
        <AddressFields valor={end} aoMudar={(v) => { setEnd(v); setErrosEnd({}); }} erros={errosEnd} />
      </div>
      {erroGeral && <Alert tipo="erro">{erroGeral}</Alert>}
      {sucesso && <Alert tipo="sucesso">{sucesso}</Alert>}
      <Button type="submit" tamanho="lg" carregando={enviando} className="w-full sm:w-auto">Salvar alterações</Button>
    </form>
  );
}
