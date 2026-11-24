import { Check, Circle } from 'lucide-react';
import { avaliarSenha } from '@/utils/validators';
import { cn } from '@/lib/cn';

export function SenhaRegras({ senha }: { senha: string }) {
  const r = avaliarSenha(senha);
  const regras: [boolean, string][] = [
    [r.tamanho, 'Pelo menos 8 caracteres'],
    [r.maiuscula, 'Uma letra maiúscula'],
    [r.numero, 'Um número'],
    [r.especial, 'Um símbolo (por exemplo: @ ! # $ %)'],
  ];
  return (
    <ul className="space-y-1 text-sm" aria-label="Requisitos da senha">
      {regras.map(([ok, texto]) => (
        <li key={texto} className={cn('flex items-center gap-2', ok ? 'text-ok' : 'text-muted')}>
          {ok ? <Check aria-hidden className="size-4" /> : <Circle aria-hidden className="size-4" />}
          <span>{texto}</span>
          <span className="sr-only">{ok ? '(atendido)' : '(pendente)'}</span>
        </li>
      ))}
    </ul>
  );
}
