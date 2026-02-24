// Final
import { Ship, LogOut, History, LayoutDashboard, Users, Settings, Building2, User, Clock, Activity, Shield } from 'lucide-react';
import { useMarina } from '@/contexts/MarinaContext';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import { APP_VERSION } from '@/lib/version';

export function Header() {
  const { empresaAtual, user, logout, getPessoasDentro } = useMarina();
  const location = useLocation();
  const navigate = useNavigate();

  // Função para fazer logout e redirecionar
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Calcular estatísticas em tempo real
  const stats = useMemo(() => {
    const pessoasDentro = getPessoasDentro();
    const totalPessoas = pessoasDentro.length;
    const tempoMedio = totalPessoas > 0
      ? Math.round(pessoasDentro.reduce((acc, p) => {
          const tempo = Date.now() - new Date(p.entradaEm).getTime();
          return acc + (tempo / (1000 * 60 * 60)); // em horas
        }, 0) / totalPessoas * 10) / 10
      : 0;

    return { totalPessoas, tempoMedio };
  }, [getPessoasDentro]);

  // Verificar permissões para exibir Admin
  const podeVerAdmin = user?.role === 'admin' || user?.role === 'owner';
  
  const navItems = [
    { href: '/', label: 'Painel', icon: LayoutDashboard },
    { href: '/historico', label: 'Histórico', icon: History },
    { href: '/pessoas', label: 'Pessoas', icon: Users },
    ...(podeVerAdmin ? [{ href: '/admin', label: 'Admin', icon: Settings }] : []),
    ...(podeVerAdmin ? [{ href: '/auditoria', label: 'Auditoria', icon: Shield }] : []),
  ];


  return (
    <header className="corporate-header sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-lg border-b border-blue-500/30">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header Corporativo Unificado */}
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Logo e Nome da Empresa */}
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 border border-white/20 shadow-sm flex-shrink-0">
              <Ship className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-semibold text-white tracking-wide truncate">
                BR Marinas
              </h1>
              <p className="hidden md:block text-xs text-slate-300 font-medium truncate">
                Sistema de Controle de Acesso - BR Marinas v{APP_VERSION}
              </p>
            </div>
          </div>

          {/* Navegação Principal - Desktop (1024px+) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 lg:px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                    isActive
                      ? "bg-white/10 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Tablet Navigation (768px - 1023px) */}
          <nav className="hidden md:block lg:hidden">
            <div className="flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 relative",
                      isActive
                        ? "bg-white/10 text-white font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Informações Laterais */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">

            {/* Informações da Empresa */}
            <div className="flex items-center gap-1 md:gap-2">
              <Building2 className="h-4 w-4 text-slate-300 hidden sm:block" />
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20 font-medium text-xs md:text-sm">
                {empresaAtual?.nome || 'Marina'}
              </Badge>
            </div>

            {/* Botão de Logout */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="transition-all duration-200"
              title="Sair do sistema"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline ml-1">Sair</span>
            </Button>
          </div>
        </div>

        {/* Mobile/Tablet Navigation (abaixo de 768px) */}
        <div className="md:hidden border-t border-white/10 bg-white/5">
          <div className="grid grid-cols-5 gap-1 py-2 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-xs font-medium transition-all duration-200 relative",
                    isActive
                      ? "bg-white/10 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-center leading-tight">{item.label}</span>
                  {isActive && (
                    <div className="absolute inset-x-1 bottom-1 h-0.5 bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
