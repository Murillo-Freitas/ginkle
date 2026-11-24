'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { Alert } from '@/components/ui/feedback';
import { SenhaRegras } from '../senha-regras';
import { senhaForte } from '@/utils/validators';

export function RedefinirSenhaForm() {
  const router = useRouter();
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function salvar(ev: FormEvent) {
    ev.preventDefault();
    setErro('');
    if (!senhaForte(senha)) { setErro('A senha não atende a todos os requisitos.'); return; }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return; }
    setEnviando(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) {
        setErro(error.message.toLowerCase().includes('different') ? 'A nova senha precisa ser diferente da senha atual.' : 'Não foi possível alterar a senha. Peça um novo link e tente novamente.');
        return;
      }
      const { error: erroSaida } = await supabase.auth.signOut();
      if (erroSaida) console.warn('[auth] Senha alterada, mas a sessão não foi encerrada:', erroSaida);
      router.replace('/login?aviso=senha_alterada');
      router.refresh();
    } catch (falha) {
      console.error('[auth] Falha ao atualizar senha:', falha);
      setErro('Não foi possível alterar a senha. Confira sua conexão e tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} noValidate className="space-y-5">
      <Input rotulo="Nova senha" type="password" autoComplete="new-password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
      <SenhaRegras senha={senha} />
      <Input rotulo="Confirmar nova senha" type="password" autoComplete="new-password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
      {erro && <Alert tipo="erro">{erro}</Alert>}
      <Button type="submit" tamanho="lg" carregando={enviando} className="w-full">Salvar nova senha</Button>
    </form>
  );
}
