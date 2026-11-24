import type { Metadata, Viewport } from 'next';
import { Inter, Syne } from 'next/font/google';
import './globals.css';
import { RegistrarSW } from '@/components/layout/registrar-sw';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Ginkle | Acompanhamento e gestão para casas de repouso',
    template: '%s | Ginkle',
  },
  description:
    'Rotina, medicação e ocorrências registradas por quem cuida e visíveis para quem ama. Encontre casas de repouso e acompanhe o cuidado com transparência.',
  openGraph: { type: 'website', locale: 'pt_BR', siteName: 'Ginkle' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f9f4' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1f10' },
  ],
};

// Aplica o tema salvo antes da primeira pintura (evita "piscar"). Padrão: claro.
const temaInicial = `try{if(localStorage.getItem('ginkle-tema')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${syne.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaInicial }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
