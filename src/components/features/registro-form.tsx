'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/form';
import { Alert } from '@/components/ui/feedback';
import { mensagemDeErro } from './formulario-generico';
import { enfileirar, parecemErroDeRede } from '@/lib/fila-offline';
import { notificarPush } from '@/lib/push-cliente';
import { cn } from '@/lib/cn';
import { CATEGORIAS_CUIDADO, CATEGORIAS_OCORRENCIA, SITUACOES_MEDICACAO, TIPOS_REGISTRO } from '@/utils/constants';
import { paraNumero } from '@/utils/formatters';
import type { DadosVitais, TipoRegistro } from '@/types';

interface Props {
  residentes: { id: string; nome: string; quarto?: string | null }[];
  usuarioId: string;
  emailUsuario: string;
  tipoInicial?: TipoRegistro;
  tipoFixo?: boolean;
  residenteInicial?: string;
}

const LIMITES: Record<keyof DadosVitais, [number, number, string]> = {
  pa_sistolica: [40, 300, 'Pressão sistólica'],
  pa_diastolica: [20, 200, 'Pressão diastólica'],
  fc: [20, 250, 'Frequência cardíaca'],
  temperatura: [30, 45, 'Temperatura'],
  spo2: [50, 100, 'Saturação'],
  glicemia: [10, 800, 'Glicemia'],
  peso: [10, 300, 'Peso'],
};

const vazio = { categoria: '', titulo: '', descricao: '', urgente: false, medicamento: '', dose: '', lote: '', situacao: 'ADMINISTRADO', humor: '', estado: '' };
const vitaisVazios = { pa_sistolica: '', pa_diastolica: '', fc: '', temperatura: '', spo2: '', glicemia: '', peso: '' };

export function RegistroForm({ residentes, usuarioId, emailUsuario, tipoInicial = 'CUIDADO', tipoFixo = false, residenteInicial = '' }: Props) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoRegistro>(tipoInicial);
  const [residenteId, setResidenteId] = useState(residenteInicial);
  const [f, setF] = useState(vazio);
  const [vitais, setVitais] = useState<Record<keyof DadosVitais, string>>(vitaisVazios);
  const [senha, setSenha] = useState('');
  const [online, setOnline] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const ligou = () => setOnline(true);
    const caiu = () => setOnline(false);
    window.addEventListener('online', ligou);
    window.addEventListener('offline', caiu);
    return () => { window.removeEventListener('online', ligou); window.removeEventListener('offline', caiu); };
  }, []);

  const set = (campo: keyof typeof vazio, valor: string | boolean) => { setF((x) => ({ ...x, [campo]: valor })); setSucesso(''); };

  function montar(): { payload: Record<string, unknown> } | { erro: string } {
    if (!residenteId) return { erro: 'Selecione o residente.' };
    const base: Record<string, unknown> = {
      residente_id: residenteId, tipo, urgente: tipo === 'OCORRENCIA' ? f.urgente : false,
      criado_em_dispositivo: new Date().toISOString(),
    };
    if ((tipo === 'CUIDADO' || tipo === 'SINAIS_VITAIS')) {
      if (f.humor) base.humor = f.humor;
      if (f.estado) base.estado_geral = f.estado;
    }

    if (tipo === 'CUIDADO') {
      if (!f.categoria) return { erro: 'Selecione o tipo de cuidado.' };
      if (f.descricao.trim().length < 3) return { erro: 'Descreva o cuidado realizado.' };
      return { payload: { ...base, categoria: f.categoria, titulo: f.titulo.trim() || f.categoria, descricao: f.descricao.trim() } };
    }
    if (tipo === 'MEDICACAO') {
      if (!f.medicamento.trim()) return { erro: 'Informe o nome do medicamento.' };
      const situacao = SITUACOES_MEDICACAO[f.situacao];
      return {
        payload: {
          ...base,
          titulo: `${f.medicamento.trim()}${f.dose.trim() ? ` ${f.dose.trim()}` : ''}`.slice(0, 120),
          descricao: f.descricao.trim() || `${situacao} conforme prescrição.`,
          medicamento: f.medicamento.trim(), dose: f.dose.trim() || null, lote: f.lote.trim() || null, situacao: f.situacao,
        },
      };
    }
    if (tipo === 'OCORRENCIA') {
      if (!f.categoria) return { erro: 'Selecione o tipo de ocorrência.' };
      if (f.titulo.trim().length < 3) return { erro: 'Informe um título para a ocorrência.' };
      if (f.descricao.trim().length < 3) return { erro: 'Descreva o que aconteceu e as providências tomadas.' };
      return { payload: { ...base, categoria: f.categoria, titulo: f.titulo.trim(), descricao: f.descricao.trim() } };
    }

    const dados: DadosVitais = {};
    for (const campo of Object.keys(vitais) as (keyof DadosVitais)[]) {
      const texto = vitais[campo].trim();
      if (!texto) continue;
      const n = paraNumero(texto);
      const [min, max, nome] = LIMITES[campo];
      if (Number.isNaN(n) || n < min || n > max) return { erro: `${nome}: valor fora do intervalo possível (${min} a ${max}). Confira a digitação.` };
      dados[campo] = n;
    }
    if (Object.keys(dados).length === 0) return { erro: 'Informe pelo menos uma medição.' };
    if ((dados.pa_sistolica && !dados.pa_diastolica) || (!dados.pa_sistolica && dados.pa_diastolica)) {
      return { erro: 'Informe a pressão arterial completa (sistólica e diastólica).' };
    }
    const partes: string[] = [];
    if (dados.pa_sistolica) partes.push(`PA ${dados.pa_sistolica}/${dados.pa_diastolica} mmHg`);
    if (dados.fc) partes.push(`FC ${dados.fc} bpm`);
    if (dados.temperatura) partes.push(`Temp. ${String(dados.temperatura).replace('.', ',')} °C`);
    if (dados.spo2) partes.push(`SpO₂ ${dados.spo2}%`);
    if (dados.glicemia) partes.push(`Glicemia ${dados.glicemia} mg/dL`);
    if (dados.peso) partes.push(`Peso ${String(dados.peso).replace('.', ',')} kg`);
    const obs = f.descricao.trim();
    return { payload: { ...base, titulo: 'Sinais vitais', descricao: partes.join(' · ') + (obs ? `. ${obs}` : ''), dados } };
  }

  function limpar() {
    setF(vazio);
    setVitais(vitaisVazios);
    setSenha('');
  }

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setErro(''); setSucesso('');
    const r = montar();
    if ('erro' in r) { setErro(r.erro); return; }
    const payload = r.payload;
    const supabase = createClient();
    const semConexao = !navigator.onLine;

    setEnviando(true);
    // Assinatura digital: a medicação só é assinada com a confirmação da senha (exige conexão).
    if (tipo === 'MEDICACAO' && !semConexao) {
      if (!senha) { setEnviando(false); setErro('Digite a sua senha para assinar o registro de medicação.'); return; }
      const { error: erroSenha } = await supabase.auth.signInWithPassword({ email: emailUsuario, password: senha });
      if (erroSenha) { setEnviando(false); setErro('Senha incorreta: a assinatura não foi confirmada.'); return; }
      payload.assinado = true;
    }

    const guardarNoAparelho = () => {
      enfileirar(usuarioId, payload);
      limpar();
      setSucesso('Sem conexão: o registro foi salvo neste aparelho e será enviado automaticamente quando a internet voltar.');
    };

    if (semConexao) { setEnviando(false); guardarNoAparelho(); return; }

    const { data, error } = await supabase.from('registros_assistenciais').insert(payload).select('id').single();
    setEnviando(false);
    if (error) {
      if (parecemErroDeRede(error.message)) { guardarNoAparelho(); return; }
      setErro(mensagemDeErro(error));
      return;
    }
    limpar();
    setSucesso('Registro salvo. Ele já está visível para os familiares vinculados.');
    if (payload.urgente && data) notificarPush('registro', (data as { id: string }).id);
    router.refresh();
  }

  if (residentes.length === 0) {
    return <Alert tipo="aviso">Não há residentes ativos nesta casa de repouso. Peça ao gestor para cadastrar os residentes.</Alert>;
  }

  const campoVital = (campo: keyof DadosVitais, rotulo: string, dica?: string) => (
    <Input rotulo={rotulo} dica={dica} inputMode="decimal" value={vitais[campo]} onChange={(e) => { setVitais((v) => ({ ...v, [campo]: e.target.value })); setSucesso(''); }} />
  );

  const indicadores = (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select rotulo="Humor do residente" dica="Opcional. Aparece como indicador verde, amarelo ou vermelho para a família." value={f.humor} onChange={(e) => set('humor', e.target.value)}>
        <option value="">Não informar</option><option value="BEM">Bem</option><option value="ATENCAO">Atenção</option><option value="ALERTA">Alerta</option>
      </Select>
      <Select rotulo="Estado geral de saúde" dica="Opcional." value={f.estado} onChange={(e) => set('estado', e.target.value)}>
        <option value="">Não informar</option><option value="BEM">Bem</option><option value="ATENCAO">Atenção</option><option value="ALERTA">Alerta</option>
      </Select>
    </div>
  );

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      {!online && (
        <Alert tipo="aviso" titulo="Você está sem conexão">
          Pode continuar registrando: tudo fica salvo neste aparelho e é enviado quando a internet voltar.{tipo === 'MEDICACAO' ? ' Registros de medicação feitos sem conexão ficam sem assinatura por senha.' : ''}
        </Alert>
      )}
      {!tipoFixo && (
        <div role="tablist" aria-label="Tipo de registro" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(TIPOS_REGISTRO) as TipoRegistro[]).map((t) => (
            <button
              key={t} type="button" role="tab" aria-selected={tipo === t}
              onClick={() => { setTipo(t); limpar(); setErro(''); setSucesso(''); }}
              className={cn('min-h-11 rounded-lg border px-3 text-sm font-semibold', tipo === t ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface hover:bg-surface-alt')}
            >
              {TIPOS_REGISTRO[t]}
            </button>
          ))}
        </div>
      )}

      <Select rotulo="Residente" required value={residenteId} onChange={(e) => { setResidenteId(e.target.value); setSucesso(''); }}>
        <option value="">Selecione o residente…</option>
        {residentes.map((r) => <option key={r.id} value={r.id}>{r.nome}{r.quarto ? ` · Quarto ${r.quarto}` : ''}</option>)}
      </Select>

      {tipo === 'CUIDADO' && (
        <>
          <Select rotulo="Tipo de cuidado" required value={f.categoria} onChange={(e) => set('categoria', e.target.value)}>
            <option value="">Selecione…</option>
            {CATEGORIAS_CUIDADO.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input rotulo="Título" dica="Opcional. Se vazio, usamos o tipo de cuidado." maxLength={120} value={f.titulo} onChange={(e) => set('titulo', e.target.value)} />
          <Textarea rotulo="O que foi feito" required value={f.descricao} onChange={(e) => set('descricao', e.target.value)} />
          {indicadores}
        </>
      )}

      {tipo === 'MEDICACAO' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input rotulo="Medicamento" required value={f.medicamento} onChange={(e) => set('medicamento', e.target.value)} />
            <Input rotulo="Dose" placeholder="Ex.: 50 mg" value={f.dose} onChange={(e) => set('dose', e.target.value)} />
            <Input rotulo="Lote" dica="Para rastreabilidade" value={f.lote} onChange={(e) => set('lote', e.target.value)} />
            <Select rotulo="Situação" required value={f.situacao} onChange={(e) => set('situacao', e.target.value)}>
              {Object.entries(SITUACOES_MEDICACAO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </Select>
          </div>
          <Textarea rotulo="Observações" dica="Opcional. Informe o motivo se foi recusado ou adiado." rows={3} value={f.descricao} onChange={(e) => set('descricao', e.target.value)} />
          {online && (
            <Input rotulo="Sua senha (assinatura do registro)" type="password" autoComplete="current-password" required value={senha}
              onChange={(e) => setSenha(e.target.value)} dica="A confirmação da senha assina o registro em seu nome." />
          )}
        </>
      )}

      {tipo === 'SINAIS_VITAIS' && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {campoVital('pa_sistolica', 'Pressão sistólica', 'mmHg')}
            {campoVital('pa_diastolica', 'Pressão diastólica', 'mmHg')}
            {campoVital('fc', 'Freq. cardíaca', 'bpm')}
            {campoVital('temperatura', 'Temperatura', '°C')}
            {campoVital('spo2', 'Saturação (SpO₂)', '%')}
            {campoVital('glicemia', 'Glicemia', 'mg/dL')}
            {campoVital('peso', 'Peso', 'kg')}
          </div>
          <Textarea rotulo="Observações" dica="Opcional." rows={2} value={f.descricao} onChange={(e) => set('descricao', e.target.value)} />
          {indicadores}
        </>
      )}

      {tipo === 'OCORRENCIA' && (
        <>
          <Select rotulo="Tipo de ocorrência" required value={f.categoria} onChange={(e) => set('categoria', e.target.value)}>
            <option value="">Selecione…</option>
            {CATEGORIAS_OCORRENCIA.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input rotulo="Título" required maxLength={120} value={f.titulo} onChange={(e) => set('titulo', e.target.value)} />
          <Textarea rotulo="O que aconteceu e quais providências foram tomadas" required value={f.descricao} onChange={(e) => set('descricao', e.target.value)} />
          <Checkbox rotulo="Marcar como urgente (destaca o registro e avisa a família por notificação)" checked={f.urgente} onChange={(e) => set('urgente', e.target.checked)} />
        </>
      )}

      {erro && <Alert tipo="erro">{erro}</Alert>}
      {sucesso && <Alert tipo="sucesso">{sucesso}</Alert>}
      <p className="text-sm text-muted">Registros não podem ser editados ou apagados depois de salvos. Em caso de erro, crie um novo registro explicando a correção.</p>
      <Button type="submit" carregando={enviando} className="w-full sm:w-auto">Salvar registro</Button>
    </form>
  );
}
