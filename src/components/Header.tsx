import { Ship, LogOut, History, LayoutDashboard, Users, Settings, Building2, User, Clock, Activity } from 'lucide-react';
import { useMarina } from '@/contexts/MarinaContext';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

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
  ];


  return (
    <header className="corporate-header sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-lg border-b border-blue-500/30">
      <div className="container mx-auto px-6">
        {/* Header Corporativo Unificado */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo e Nome da Empresa */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 border border-white/20 shadow-sm">
              <Ship className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-wide">
                BR Marinas
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Sistema de Controle de Acesso - BR Marinas
              </p>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative",
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

          {/* Informações Laterais */}
          <div className="flex items-center gap-4">

            {/* Informações da Empresa */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-300" />
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20 font-medium text-sm">
                {empresaAtual?.nome || 'Marina'}
              </Badge>
            </div>

            {/* Botão de Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/10"
              title="Sair do sistema"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between py-3 px-3">
            {/* Mobile Stats */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium text-white">{stats.totalPessoas}</span>
              </div>
              {stats.tempoMedio > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-300" />
                  <span className="text-sm font-medium text-white">{stats.tempoMedio}h médio</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-white">{user?.nome?.split(' ')[0]}</span>
                <p className="text-xs text-blue-200">{empresaAtual?.nome || 'Marina'}</p>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="grid grid-cols-4 gap-1 py-2 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-xs font-medium transition-all duration-200",
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
