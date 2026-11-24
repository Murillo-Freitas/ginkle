import Link from 'next/link';
import { Logo } from './logo';

export function SiteFooter() {
  const link = 'text-brand-200 hover:text-white hover:underline underline-offset-4';
  return (
    <footer className="mt-auto bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="[&_span.text-ink]:text-white"><Logo /></div>
          <p className="mt-3 max-w-sm text-sm text-brand-200">
            Transparência no cuidado: rotina, medicação e ocorrências registradas por quem cuida e visíveis para quem ama.
          </p>
        </div>
        <nav aria-label="Navegação do rodapé">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">Navegação</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className={link} href="/">Início</Link></li>
            <li><Link className={link} href="/casas-de-repouso">Casas de repouso</Link></li>
            <li><Link className={link} href="/sobre">Sobre nós</Link></li>
            <li><Link className={link} href="/privacidade">Privacidade e dados</Link></li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">Acesso</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className={link} href="/login">Entrar</Link></li>
            <li><Link className={link} href="/cadastro">Criar conta de familiar</Link></li>
            <li><Link className={link} href="/cadastrar-casa">Cadastrar minha casa de repouso</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-900">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-brand-300 sm:px-6 lg:px-8">
          © 2026 Ginkle · Projeto de Trabalho de Conclusão de Curso, equipe Viventi · ETEC de Praia Grande, Centro Paula Souza.
        </p>
      </div>
    </footer>
  );
}
