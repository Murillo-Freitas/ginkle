'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/form';
import { Alert } from '@/components/ui/feedback';
import { Modal } from '@/components/ui/modal';
import { formatarCNPJ, formatarCPF, formatarTelefone, paraNumero, soDigitos } from '@/utils/formatters';
import { validarCNPJ, validarCPF, validarEmail, validarTelefone } from '@/utils/validators';
import { notificarPush } from '@/lib/push-cliente';
import type { Variante, Tamanho } from '@/components/ui/button';

export type TipoCampo =
  | 'texto' | 'email' | 'cpf' | 'cnpj' | 'telefone' | 'data' | 'hora' | 'mes' | 'numero' | 'dinheiro' | 'select' | 'textarea' | 'checkbox';

export interface CampoConfig {
  nome: string;
  rotulo: string;
  tipo?: TipoCampo;
  obrigatorio?: boolean;
  opcoes?: { valor: string; rotulo: string }[];
  dica?: string;
  placeholder?: string;
  inicial?: string | boolean;
  min?: number;
  max?: number;
  maxLen?: number;
  largura?: 'total' | 'metade';
}

export type AcaoFormulario =
  | { tipo: 'rpc'; nome: string; extra?: Record<string, unknown> }
  | { tipo: 'insert'; tabela: string; extra?: Record<string, unknown> }
  | { tipo: 'upsert'; tabela: string; conflito: string; extra?: Record<string, unknown> }
  | { tipo: 'update'; tabela: string; id: string; extra?: Record<string, unknown> };

export interface FormularioProps {
  campos: CampoConfig[];
  acao: AcaoFormulario;
  rotuloEnvio: string;
  mensagemSucesso?: string;
  redirecionarPara?: string;
  limparAoConcluir?: boolean;
  aoConcluir?: () => void;
}

export function mensagemDeErro(erro: { message: string; code?: string }): string {
  if (erro.code === '42501') return 'Você não tem permissão para realizar esta ação.';
  if (erro.code === '23505') return 'Já existe um registro com esses dados.';
  if (erro.code === '23514') return 'Algum dos valores informados não é válido. Confira os campos.';
  if (erro.code === '23503') return 'Um dos itens relacionados não foi encontrado.';
  return erro.message;
}

type Valores = Record<string, string | boolean>;

function valoresIniciais(campos: CampoConfig[]): Valores {
  return Object.fromEntries(campos.map((c) => [c.nome, c.inicial ?? (c.tipo === 'checkbox' ? false : '')]));
}

export function FormularioGenerico({
  campos, acao, rotuloEnvio, mensagemSucesso = 'Salvo com sucesso.', redirecionarPara, limparAoConcluir = true, aoConcluir,
}: FormularioProps) {
  const router = useRouter();
  const [valores, setValores] = useState<Valores>(() => valoresIniciais(campos));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  function alterar(campo: CampoConfig, bruto: string | boolean) {
    let valor = bruto;
    if (typeof bruto === 'string') {
      if (campo.tipo === 'cpf') valor = formatarCPF(bruto);
      if (campo.tipo === 'cnpj') valor = formatarCNPJ(bruto);
      if (campo.tipo === 'telefone') valor = formatarTelefone(bruto);
    }
    setValores((v) => ({ ...v, [campo.nome]: valor }));
    setErros((e) => ({ ...e, [campo.nome]: '' }));
    setSucesso('');
  }

  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    for (const c of campos) {
      const v = valores[c.nome];
      const texto = typeof v === 'string' ? v.trim() : '';
      if (c.tipo === 'checkbox') continue;
      if (!texto) {
        if (c.obrigatorio) e[c.nome] = 'Campo obrigatório.';
        continue;
      }
      if (c.tipo === 'cpf' && !validarCPF(texto)) e[c.nome] = 'CPF inválido.';
      if (c.tipo === 'cnpj' && !validarCNPJ(texto)) e[c.nome] = 'CNPJ inválido.';
      if (c.tipo === 'email' && !validarEmail(texto)) e[c.nome] = 'E-mail inválido.';
      if (c.tipo === 'telefone' && !validarTelefone(texto)) e[c.nome] = 'Telefone inválido. Informe o DDD.';
      if (c.tipo === 'numero' || c.tipo === 'dinheiro') {
        const n = paraNumero(texto);
        if (Number.isNaN(n)) e[c.nome] = 'Informe um número válido.';
        else if (c.tipo === 'dinheiro' && n <= 0) e[c.nome] = 'Informe um valor maior que zero.';
        else if (c.min !== undefined && n < c.min) e[c.nome] = `O valor mínimo é ${c.min}.`;
        else if (c.max !== undefined && n > c.max) e[c.nome] = `O valor máximo é ${c.max}.`;
      }
      if (c.maxLen && texto.length > c.maxLen) e[c.nome] = `Use no máximo ${c.maxLen} caracteres.`;
    }
    return e;
  }

  function montarPayload(): Record<string, unknown> {
    const p: Record<string, unknown> = {};
    for (const c of campos) {
      const v = valores[c.nome];
      if (c.tipo === 'checkbox') { p[c.nome] = Boolean(v); continue; }
      const texto = typeof v === 'string' ? v.trim() : '';
      if (!texto) { p[c.nome] = null; continue; }
      if (c.tipo === 'cpf' || c.tipo === 'cnpj' || c.tipo === 'telefone') p[c.nome] = soDigitos(texto);
      else if (c.tipo === 'numero' || c.tipo === 'dinheiro') p[c.nome] = paraNumero(texto);
      else if (c.tipo === 'mes') p[c.nome] = `${texto}-01`;
      else p[c.nome] = texto;
    }
    return p;
  }

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setErroGeral('');
    setSucesso('');
    const e = validar();
    setErros(e);
    if (Object.values(e).some(Boolean)) return;

    setEnviando(true);
    const supabase = createClient();
    const dados = montarPayload();
    let erro: { message: string; code?: string } | null = null;

    let idCriado: string | null = null;
    if (acao.tipo === 'rpc') {
      ({ error: erro } = await supabase.rpc(acao.nome, { ...dados, ...acao.extra }));
    } else if (acao.tipo === 'insert') {
      if (acao.tabela === 'adesoes_ilpi') {
        const resultado = await supabase.from(acao.tabela).insert({ ...dados, ...acao.extra }).select('id').single();
        erro = resultado.error;
        idCriado = (resultado.data as { id: string } | null)?.id ?? null;
      } else {
        ({ error: erro } = await supabase.from(acao.tabela).insert({ ...dados, ...acao.extra }));
      }
    } else if (acao.tipo === 'upsert') {
      ({ error: erro } = await supabase.from(acao.tabela).upsert({ ...dados, ...acao.extra }, { onConflict: acao.conflito }));
    } else {
      ({ error: erro } = await supabase.from(acao.tabela).update({ ...dados, ...acao.extra }).eq('id', acao.id));
    }
    setEnviando(false);

    if (erro) {
      setErroGeral(mensagemDeErro(erro));
      return;
    }
    if (acao.tipo === 'insert' && acao.tabela === 'adesoes_ilpi' && idCriado) {
      notificarPush('solicitacao_nova', idCriado);
    }
    if (acao.tipo === 'rpc' && acao.nome === 'responder_solicitacao') {
      const idSolicitacao = typeof acao.extra?.p_id === 'string' ? acao.extra.p_id : null;
      if (idSolicitacao) notificarPush('solicitacao_resposta', idSolicitacao);
    }
    setSucesso(mensagemSucesso);
    if (limparAoConcluir) setValores(valoresIniciais(campos));
    router.refresh();
    if (redirecionarPara) router.push(redirecionarPara);
    aoConcluir?.();
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {campos.map((c) => {
          const larg = c.largura === 'metade' ? '' : 'sm:col-span-2';
          const erro = erros[c.nome] || undefined;
          const valor = valores[c.nome];
          return (
            <div key={c.nome} className={larg}>
              {c.tipo === 'select' ? (
                <Select rotulo={c.rotulo} required={c.obrigatorio} erro={erro} dica={c.dica} value={String(valor)} onChange={(e) => alterar(c, e.target.value)}>
                  <option value="">Selecione…</option>
                  {c.opcoes?.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
                </Select>
              ) : c.tipo === 'textarea' ? (
                <Textarea rotulo={c.rotulo} required={c.obrigatorio} erro={erro} dica={c.dica} placeholder={c.placeholder} value={String(valor)} onChange={(e) => alterar(c, e.target.value)} />
              ) : c.tipo === 'checkbox' ? (
                <Checkbox rotulo={c.rotulo} checked={Boolean(valor)} onChange={(e) => alterar(c, e.target.checked)} />
              ) : (
                <Input
                  rotulo={c.rotulo}
                  required={c.obrigatorio}
                  erro={erro}
                  dica={c.dica}
                  placeholder={c.placeholder}
                  value={String(valor)}
                  onChange={(e) => alterar(c, e.target.value)}
                  type={c.tipo === 'email' ? 'email' : c.tipo === 'data' ? 'date' : c.tipo === 'hora' ? 'time' : c.tipo === 'mes' ? 'month' : 'text'}
                  inputMode={c.tipo === 'cpf' || c.tipo === 'cnpj' ? 'numeric' : c.tipo === 'telefone' ? 'tel' : c.tipo === 'numero' || c.tipo === 'dinheiro' ? 'decimal' : undefined}
                />
              )}
            </div>
          );
        })}
      </div>
      {erroGeral && <Alert tipo="erro">{erroGeral}</Alert>}
      {sucesso && <Alert tipo="sucesso">{sucesso}</Alert>}
      <Button type="submit" carregando={enviando} className="w-full sm:w-auto">{rotuloEnvio}</Button>
    </form>
  );
}

interface ModalFormularioProps extends FormularioProps {
  rotuloBotao: string;
  titulo: string;
  descricao?: string;
  variante?: Variante;
  tamanho?: Tamanho;
}

export function ModalFormulario({ rotuloBotao, titulo, descricao, variante = 'primario', tamanho = 'md', ...form }: ModalFormularioProps) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <Button variante={variante} tamanho={tamanho} onClick={() => setAberto(true)}>{rotuloBotao}</Button>
      <Modal aberto={aberto} aoFechar={() => setAberto(false)} titulo={titulo}>
        {descricao && <p className="mb-4 text-sm text-muted">{descricao}</p>}
        {aberto && <FormularioGenerico {...form} aoConcluir={() => { setAberto(false); form.aoConcluir?.(); }} />}
      </Modal>
    </>
  );
}
