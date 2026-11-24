'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { estiloCampo, estiloRotulo } from './estilos';

interface CampoProps {
  id: string;
  rotulo?: string;
  erro?: string;
  dica?: string;
  obrigatorio?: boolean;
  children: ReactNode;
}

export function Campo({ id, rotulo, erro, dica, obrigatorio, children }: CampoProps) {
  return (
    <div>
      {rotulo && (
        <label htmlFor={id} className={estiloRotulo}>
          {rotulo}
          {obrigatorio && <span aria-hidden className="text-danger"> *</span>}
        </label>
      )}
      {children}
      {dica && !erro && <p id={`${id}-dica`} className="mt-1.5 text-sm text-muted">{dica}</p>}
      {erro && <p id={`${id}-erro`} role="alert" className="mt-1.5 text-sm font-medium text-danger">{erro}</p>}
    </div>
  );
}

interface ExtraProps { rotulo?: string; erro?: string; dica?: string }

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & ExtraProps>(function Input(
  { rotulo, erro, dica, className, id, required, ...props }, ref,
) {
  const gerado = useId();
  const idf = id ?? gerado;
  return (
    <Campo id={idf} rotulo={rotulo} erro={erro} dica={dica} obrigatorio={required}>
      <input
        ref={ref}
        id={idf}
        required={required}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${idf}-erro` : dica ? `${idf}-dica` : undefined}
        className={cn(estiloCampo, erro && 'border-danger', className)}
        {...props}
      />
    </Campo>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & ExtraProps>(function Select(
  { rotulo, erro, dica, className, id, required, children, ...props }, ref,
) {
  const gerado = useId();
  const idf = id ?? gerado;
  return (
    <Campo id={idf} rotulo={rotulo} erro={erro} dica={dica} obrigatorio={required}>
      <select
        ref={ref}
        id={idf}
        required={required}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${idf}-erro` : dica ? `${idf}-dica` : undefined}
        className={cn(estiloCampo, 'pr-9', erro && 'border-danger', className)}
        {...props}
      >
        {children}
      </select>
    </Campo>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & ExtraProps>(function Textarea(
  { rotulo, erro, dica, className, id, required, ...props }, ref,
) {
  const gerado = useId();
  const idf = id ?? gerado;
  return (
    <Campo id={idf} rotulo={rotulo} erro={erro} dica={dica} obrigatorio={required}>
      <textarea
        ref={ref}
        id={idf}
        required={required}
        rows={4}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${idf}-erro` : dica ? `${idf}-dica` : undefined}
        className={cn(estiloCampo, 'resize-y', erro && 'border-danger', className)}
        {...props}
      />
    </Campo>
  );
});

export function Checkbox({ rotulo, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { rotulo: ReactNode }) {
  return (
    <label className={cn('flex min-h-11 cursor-pointer items-start gap-3 py-2 text-base', className)}>
      <input type="checkbox" className="mt-1 size-5 shrink-0 accent-[var(--primary)]" {...props} />
      <span>{rotulo}</span>
    </label>
  );
}
