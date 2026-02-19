// Final
import { 
  Users,
  User,
  Gift,
  Ship,
  Briefcase,
  Wrench,
  HelpCircle
} from 'lucide-react';
import { Pessoa } from '@/types/marina';

export function getIconForUserType(tipo?: string | null) {
  switch (tipo) {
    case 'cliente':
      return Users;
    case 'visita':
      return Gift;
    case 'marinheiro':
      return Ship;
    case 'prestador':
      return Wrench;
    case 'proprietario':
      return Briefcase;
    case 'colaborador':
      return User;
    default:
      return HelpCircle;
  }
}

export function getColorForUserType(tipo?: string | null) {
  switch (tipo) {
    case 'cliente':
      return 'text-blue-600';
    case 'visita':
      return 'text-green-600';
    case 'marinheiro':
      return 'text-blue-800';
    case 'prestador':
      return 'text-gray-600';
    case 'proprietario':
      return 'text-purple-600';
    case 'colaborador':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
}

export function getBgColorForUserType(tipo?: string | null) {
  switch (tipo) {
    case 'cliente':
      return 'bg-blue-100';
    case 'visita':
      return 'bg-orange-100';
    case 'marinheiro':
      return 'bg-teal-100';
    case 'prestador':
      return 'bg-gray-100';
    case 'proprietario':
      return 'bg-purple-100';
    case 'colaborador':
      return 'bg-green-100';
    default:
      return 'bg-muted';
  }
}

export function UserTypeIcon({ pessoa, size = 'sm' }: { pessoa: Pessoa; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = getIconForUserType(pessoa.tipo);
  const colorClass = getColorForUserType(pessoa.tipo);
  
  const sizeMap = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  return <Icon className={`${sizeMap[size]} ${colorClass}`} />;
}

export function UserTypeAvatar({ pessoa }: { pessoa: Pessoa }) {
  const Icon = getIconForUserType(pessoa.tipo);
  const colorClass = getColorForUserType(pessoa.tipo);
  const bgColorClass = getBgColorForUserType(pessoa.tipo);

  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColorClass} flex-shrink-0`}>
      <Icon className={`h-5 w-5 ${colorClass}`} />
    </div>
  );
}
