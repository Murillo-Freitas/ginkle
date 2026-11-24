import { getSessao } from '@/lib/auth';
import { HeaderCliente } from './header-cliente';

export async function SiteHeader() {
  const sessao = await getSessao();
  return (
    <HeaderCliente
      usuario={sessao ? { nome: sessao.nome, email: sessao.email, perfis: sessao.perfis } : null}
    />
  );
}
