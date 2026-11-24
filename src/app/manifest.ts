import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ginkle',
    short_name: 'Ginkle',
    description: 'Acompanhamento e gestão para casas de repouso',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F9F4',
    theme_color: '#2A532C',
    lang: 'pt-BR',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
