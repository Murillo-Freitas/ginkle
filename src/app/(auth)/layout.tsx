import Image from 'next/image';
import { Logo } from '@/components/layout/logo';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[5fr_7fr]">
      <aside className="relative hidden overflow-hidden bg-brand-950 lg:block">
        <Image src="/images/acesso.webp" alt="" fill sizes="42vw" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/40 to-brand-950/20" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="font-display text-3xl font-bold">Cuidar com tecnologia, conectar com humanidade.</p>
          <p className="mt-3 max-w-md text-brand-100">Acompanhe a rotina de quem você ama e fale diretamente com a casa de repouso.</p>
        </div>
      </aside>
      <div className="flex min-h-dvh flex-col">
        <div className="flex h-16 items-center justify-between px-4 sm:px-8">
          <Logo />
          <ThemeToggle />
        </div>
        <main id="conteudo" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
