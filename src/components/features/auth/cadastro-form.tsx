'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox, Input } from '@/components/ui/form';
import { Alert } from '@/components/ui/feedback';
import { AddressFields, enderecoVazio, validarEndereco, type Endereco, type ErrosEndereco } from '../address-fields';
import { SenhaRegras } from '../senha-regras';
import { formatarCPF, formatarTelefone, soDigitos } from '@/utils/formatters';
import { senhaForte, validarCPF, validarEmail, validarTelefone } from '@/utils/validators';

const inicial = { nome: '', cpf: '', nascimento: '', telefone: '', email: '', senha: '', confirmar: '', aceite: false };

function idadeEm(iso: string): number {
  const [a, m, d] = iso.split('-').map(Number);
  const h = new Date();
  let idade = h.getFullYear() - a;
  if (h.getMonth() + 1 < m || (h.getMonth() + 1 === m && h.getDate() < d)) idade--;
  return idade;
}

export function CadastroForm() {
  const router = useRouter();
  const [passo, setPasso] = useState<1 | 2>(1);
  const [d, setD] = useState(inicial);
  const [end, setEnd] = useState<Endereco>(enderecoVazio);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [errosEnd, setErrosEnd] = useState<ErrosEndereco>({});
  const [erroGeral, setErroGeral] = useState('');
  const [ver, setVer] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const set = (campo: keyof typeof inicial, valor: string | boolean) => {
    setD((x) => ({ ...x, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: '' }));
  };

  function validarPasso1(): boolean {
    const e: Record<string, string> = {};
    if (d.nome.trim().split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome.';
    if (!validarCPF(d.cpf)) e.cpf = 'CPF inválido.';
    if (!d.nascimento) e.nascimento = 'Informe a data de nascimento.';
    else if (idadeEm(d.nascimento) < 18) e.nascimento = 'É preciso ter 18 anos ou mais para criar uma conta.';
    else if (idadeEm(d.nascimento) > 120) e.nascimento = 'Confira a data de nascimento.';
    if (!validarTelefone(d.telefone)) e.telefone = 'Telefone inválido. Informe o DDD.';
    if (!validarEmail(d.email)) e.email = 'E-mail inválido.';
    if (!senhaForte(d.senha)) e.senha = 'A senha não atende a todos os requisitos.';
    if (d.confirmar !== d.senha) e.confirmar = 'As senhas não coincidem.';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function cadastrar(ev: FormEvent) {
    ev.preventDefault();
    setErroGeral('');
    if (passo === 1) { if (validarPasso1()) setPasso(2); return; }

    const ee = validarEndereco(end);
    setErrosEnd(ee);
    if (Object.keys(ee).length > 0) return;
    if (!d.aceite) { setErros({ aceite: 'É necessário aceitar a política de privacidade.' }); return; }

    setEnviando(true);
    const supabase = createClient();

    const { data: livre, error: erroCpf } = await supabase.rpc('cpf_disponivel', { p_cpf: soDigitos(d.cpf) });
    if (erroCpf) {
      setEnviando(false);
      setErroGeral('Não foi possível verificar o CPF agora. Tente novamente em instantes.');
      return;
    }
    if (livre === false) {
      setEnviando(false);
      setPasso(1);
      setErros({ cpf: 'Este CPF já possui cadastro. Tente entrar ou recuperar a senha.' });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: d.email.trim(),
      password: d.senha,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/cliente/dashboard`,
        data: {
          nome_completo: d.nome.trim(),
          cpf: soDigitos(d.cpf),
          data_nascimento: d.nascimento,
          telefone: soDigitos(d.telefone),
          cep: soDigitos(end.cep),
          logradouro: end.logradouro.trim(),
          numero: end.numero.trim(),
          complemento: end.complemento.trim(),
          bairro: end.bairro.trim(),
          cidade: end.cidade.trim(),
          uf: end.uf,
        },
      },
    });
    setEnviando(false);

    if (error) {
      if (error.status === 429) setErroGeral('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      else if (error.message.toLowerCase().includes('already')) { setPasso(1); setErros({ email: 'Este e-mail já possui cadastro.' }); }
      else setErroGeral('Não foi possível concluir o cadastro. Confira se o CPF e o e-mail ainda não foram cadastrados e tente novamente.');
      return;
    }
    // Com confirmação de e-mail ativa, um e-mail já cadastrado volta com a lista de identidades vazia.
    if (data.user && data.user.identities?.length === 0) {
      setPasso(1);
      setErros({ email: 'Este e-mail já possui cadastro. Tente entrar ou recuperar a senha.' });
      return;
    }
    if (data.session) {
      router.replace('/cliente/dashboard');
      router.refresh();
      return;
    }
    router.push(`/verifique-seu-email?email=${encodeURIComponent(d.email.trim())}`);
  }

  return (
    <form onSubmit={cadastrar} noValidate className="space-y-5">
      <ol className="flex items-center gap-3 text-sm font-semibold" aria-label="Etapas do cadastro">
        <li className={passo === 1 ? 'text-primary' : 'text-muted'}>1. Dados pessoais</li>
        <li aria-hidden className="text-line">/</li>
        <li className={passo === 2 ? 'text-primary' : 'text-muted'} aria-current={passo === 2 ? 'step' : undefined}>2. Endereço</li>
      </ol>

      {passo === 1 ? (
        <div className="space-y-4">
          <Input rotulo="Nome completo" required autoComplete="name" value={d.nome} onChange={(e) => set('nome', e.target.value)} erro={erros.nome} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input rotulo="CPF" required inputMode="numeric" placeholder="000.000.000-00" value={d.cpf} onChange={(e) => set('cpf', formatarCPF(e.target.value))} erro={erros.cpf} />
            <Input rotulo="Data de nascimento" required type="date" autoComplete="bday" value={d.nascimento} onChange={(e) => set('nascimento', e.target.value)} erro={erros.nascimento} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input rotulo="Telefone com DDD" required type="tel" inputMode="tel" autoComplete="tel" placeholder="(13) 99999-9999" value={d.telefone} onChange={(e) => set('telefone', formatarTelefone(e.target.value))} erro={erros.telefone} />
            <Input rotulo="E-mail" required type="email" autoComplete="email" value={d.email} onChange={(e) => set('email', e.target.value)} erro={erros.email} dica="Enviaremos um link para confirmar este e-mail." />
          </div>
          <div className="relative">
            <Input rotulo="Senha" required type={ver ? 'text' : 'password'} autoComplete="new-password" value={d.senha} onChange={(e) => set('senha', e.target.value)} erro={erros.senha} className="pr-12" />
            <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-0 top-[1.9rem] inline-flex size-11 items-center justify-center text-muted">
              {ver ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
            </button>
          </div>
          <SenhaRegras senha={d.senha} />
          <Input rotulo="Confirmar senha" required type={ver ? 'text' : 'password'} autoComplete="new-password" value={d.confirmar} onChange={(e) => set('confirmar', e.target.value)} erro={erros.confirmar} />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-muted">Usamos o endereço para sugerir casas de repouso próximas de você. Digite o CEP e preenchemos o restante.</p>
          <AddressFields valor={end} aoMudar={(e) => { setEnd(e); setErrosEnd({}); }} erros={errosEnd} />
          <div>
            <Checkbox
              rotulo={<>Li e concordo com a <Link href="/privacidade" target="_blank" className="font-semibold text-accent underline">política de privacidade</Link>.</>}
              checked={d.aceite} onChange={(e) => set('aceite', e.target.checked)}
            />
            {erros.aceite && <p role="alert" className="text-sm font-medium text-danger">{erros.aceite}</p>}
          </div>
        </div>
      )}

      {erroGeral && <Alert tipo="erro">{erroGeral}</Alert>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {passo === 2 ? <Button variante="contorno" tamanho="lg" onClick={() => setPasso(1)}>Voltar</Button> : <span />}
        <Button type="submit" tamanho="lg" carregando={enviando}>{passo === 1 ? 'Continuar' : 'Criar conta'}</Button>
      </div>
      <p className="text-center text-base text-muted">
        Já tem conta? <Link href="/login" className="font-semibold text-accent underline-offset-4 hover:underline">Entrar</Link>
      </p>
    </form>
  );
}
