'use client';

import { Navigation } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

/** Ordena as casas pela distância usando a localização do aparelho (só quando a pessoa clica). */
export function BotaoLocalizacao({ params }: { params: Record<string, string> }) {
  const router = useRouter();
  const [erro, setErro] = useState('');
  const [buscando, setBuscando] = useState(false);

  function usar() {
    if (!('geolocation' in navigator)) {
      setErro('Seu navegador não oferece geolocalização.');
      return;
    }
    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      setErro('A localização exige uma conexão segura (HTTPS).');
      return;
    }

    setBuscando(true);
    setErro('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const sp = new URLSearchParams(params);
        sp.set('lat', pos.coords.latitude.toFixed(5));
        sp.set('lng', pos.coords.longitude.toFixed(5));
        sp.delete('pagina');
        setBuscando(false);
        router.push(`/casas-de-repouso?${sp.toString()}`);
      },
      (falha) => {
        setBuscando(false);
        if (falha.code === falha.PERMISSION_DENIED) {
          setErro('A permissão de localização foi negada. Habilite a localização nas configurações do site e tente novamente.');
        } else if (falha.code === falha.POSITION_UNAVAILABLE) {
          setErro('O dispositivo não conseguiu determinar sua localização. Confira o GPS ou a localização do sistema.');
        } else if (falha.code === falha.TIMEOUT) {
          setErro('A localização demorou demais. Tente novamente em um local com melhor sinal.');
        } else {
          setErro('Não foi possível obter a localização. Verifique as permissões do navegador.');
        }
      },
      { timeout: 15_000, maximumAge: 60_000, enableHighAccuracy: false },
    );
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button variante="secundario" onClick={usar} carregando={buscando}><Navigation aria-hidden className="size-4" /> Mais próximas de mim</Button>
      {erro && <span role="alert" className="text-sm font-medium text-danger">{erro}</span>}
    </span>
  );
}
