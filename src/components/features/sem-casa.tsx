import { Building2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/feedback';

export function SemCasaEquipe() {
  return (
    <EmptyState
      icone={<Building2 className="size-10" />}
      titulo="Você ainda não está vinculado a uma casa de repouso"
      descricao="O gestor da casa precisa vincular a sua conta pelo CPF ou e-mail cadastrado no Ginkle. Depois disso, as telas de trabalho serão liberadas aqui."
    />
  );
}
