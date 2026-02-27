// Final
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useMarina } from '@/contexts/MarinaContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EditarPessoaModal } from '@/components/modals/EditarPessoaModal';
import { EditarMovimentacaoModal } from '@/components/modals/EditarMovimentacaoModal';
import { RegistrarSaidaPersonalizadaModal } from '@/components/modals/RegistrarSaidaPersonalizadaModal';
import { MovimentacaoComPessoa } from '@/types/marina';
import { UserTypeIcon, UserTypeAvatar } from '@/lib/userTypeIcons';
import { Pessoa, PessoaDentro } from '@/types/marina';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  Search,
  Calendar,
  FileText,
  Car,
  Clock,
  LogIn,
  LogOut,
  Filter,
  X,
  Edit,
  CalendarDays,
  BarChart3,
  Phone,
  ArrowUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatters } from '@/lib/validation';

export function HistoricoPage() {
  const { getHistoricoMovimentacoes } = useMarina();
  
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    tipo: '',
    nome: '',
    documento: '',
    placa: '',
  });

  const [globalSearch, setGlobalSearch] = useState('');

  const [pagination, setPagination] = useState({
    list: { page: 1, pageSize: 50 },
    daily: { page: 1, pageSize: 50 }
  });

  const [editandoPessoa, setEditandoPessoa] = useState<Pessoa | null>(null);
  const [editandoMovimentacao, setEditandoMovimentacao] = useState<MovimentacaoComPessoa | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'daily'>('list');
  const [saidaModal, setSaidaModal] = useState<{ open: boolean; pessoa: PessoaDentro | null }>({
    open: false,
    pessoa: null,
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  // Mobile card expand state for list view
  const [expandedListCards, setExpandedListCards] = useState<Set<string>>(new Set());
  // Mobile card expand state for daily view items
  const [expandedDailyItems, setExpandedDailyItems] = useState<Set<string>>(new Set());
  // Paginação interna para cada dia na visualização diário
  const [dailyPagination, setDailyPagination] = useState<{ [key: string]: { page: number; pageSize: number } }>({});

  // Funções para gerenciar paginação interna de cada dia
  const getDayPagination = useCallback((data: string) => {
    return dailyPagination[data] || { page: 1, pageSize: 10 };
  }, [dailyPagination]);

  const handleDayPageChange = useCallback((data: string, newPage: number) => {
    setDailyPagination(prev => ({
      ...prev,
      [data]: { ...(prev[data] || { page: 1, pageSize: 10 }), page: newPage }
    }));
  }, []);

  const handleDayPageSizeChange = useCallback((data: string, newPageSize: number) => {
    setDailyPagination(prev => ({
      ...prev,
      [data]: { ...(prev[data] || { page: 1, pageSize: 10 }), pageSize: newPageSize, page: 1 }
    }));
  }, []);

  const toggleDayExpansion = useCallback((data: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(data)) newSet.delete(data);
      else newSet.add(data);
      return newSet;
    });
  }, []);

  const isDayExpanded = useCallback((data: string) => expandedDays.has(data), [expandedDays]);

  const toggleListCard = useCallback((id: string) => {
    setExpandedListCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleDailyItem = useCallback((id: string) => {
    setExpandedDailyItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const dadosBrutos = useMemo(() => {
    return getHistoricoMovimentacoes({
      dataInicio: filtros.dataInicio || undefined,
      dataFim: filtros.dataFim || undefined,
      tipo: filtros.tipo || undefined,
      nome: filtros.nome || undefined,
      documento: filtros.documento || undefined,
      placa: filtros.placa || undefined,
    });
  }, [filtros, getHistoricoMovimentacoes]);

  const dadosFiltrados = useMemo(() => {
    if (!globalSearch.trim()) return dadosBrutos;
    const termo = globalSearch.toLowerCase().trim();
    return dadosBrutos.filter(mov => {
      const campos = [
        mov.pessoa.nome,
        mov.pessoa.documento,
        mov.pessoa.placa,
        mov.pessoa.contato,
        mov.pessoa.tipo,
        mov.observacao
      ].filter(Boolean);
      return campos.some(campo => campo.toString().toLowerCase().includes(termo));
    });
  }, [dadosBrutos, globalSearch]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filtros).some(v => v !== '') || globalSearch.trim() !== '';
  }, [filtros, globalSearch]);

  const handleFiltroChange = useCallback((campo: keyof typeof filtros, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPagination(prev => ({
      ...prev,
      list: { ...prev.list, page: 1 },
      daily: { ...prev.daily, page: 1 }
    }));
  }, []);

  const handleGlobalSearchChange = useCallback((valor: string) => {
    setGlobalSearch(valor);
    setPagination(prev => ({
      ...prev,
      list: { ...prev.list, page: 1 },
      daily: { ...prev.daily, page: 1 }
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFiltros({ dataInicio: '', dataFim: '', tipo: '', nome: '', documento: '', placa: '' });
    setGlobalSearch('');
    setPagination({ list: { page: 1, pageSize: 50 }, daily: { page: 1, pageSize: 50 } });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    const key = viewMode === 'list' ? 'list' : 'daily';
    setPagination(prev => ({ ...prev, [key]: { ...prev[key], page: newPage } }));
  }, [viewMode]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    const key = viewMode === 'list' ? 'list' : 'daily';
    setPagination(prev => ({ ...prev, [key]: { ...prev[key], pageSize: newPageSize, page: 1 } }));
  }, [viewMode]);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Data inválida';
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Data inválida';
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return format(date, "HH:mm", { locale: ptBR });
  };

  const getPaginatedItems = (items: any[], currentPage: number, pageSize: number) => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  };

  const getTotalPages = (totalItems: number, pageSize: number) => Math.ceil(totalItems / pageSize);

  const movimentacoesPorDia = useMemo(() => {
    const grupos: { [key: string]: MovimentacaoComPessoa[] } = {};
    dadosFiltrados.forEach(mov => {
      const data = format(new Date(mov.entrada_em), 'yyyy-MM-dd');
      if (!grupos[data]) grupos[data] = [];
      grupos[data].push(mov);
    });
    return Object.entries(grupos)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([data, movs]) => ({
        data,
        dataFormatada: formatDate(movs[0].entrada_em),
        movimentacoes: movs.sort((a, b) => new Date(b.entrada_em).getTime() - new Date(a.entrada_em).getTime()),
        totalEntradas: movs.length,
        dentroAgora: movs.filter(m => m.status === 'DENTRO').length,
      }));
  }, [dadosFiltrados, formatDate]);

  // ─── Reusable Pagination Component ───────────────────────────────────────────
  const PaginationBar = ({ total, page, pageSize, label }: { total: number; page: number; pageSize: number; label: string }) => {
    const totalPages = getTotalPages(total, pageSize);
    if (totalPages <= 1) return null;
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border">
        <div className="text-sm text-black">
          Mostrando {Math.min((page - 1) * pageSize + 1, total)} a {Math.min(page * pageSize, total)} de {total} {label}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink onClick={() => handlePageChange(pageNum)} isActive={page === pageNum} className="cursor-pointer">
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(page + 1)}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Filters panel */}
        <div className="card-elevated p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <History className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">
                  Histórico de Movimentações
                </h2>
                <p className="text-sm text-muted-foreground">
                  {dadosFiltrados.length} registro{dadosFiltrados.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex rounded-lg border border-border p-1 bg-muted/30">
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="gap-1.5 text-xs"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Lista
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'daily' ? 'default' : 'ghost'}
                onClick={() => setViewMode('daily')}
                className="gap-1.5 text-xs"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Diário
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar em todo o histórico..."
                value={globalSearch}
                onChange={(e) => handleGlobalSearchChange(e.target.value)}
                className="pl-10 h-9 text-sm border-border/50"
              />
              {globalSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleGlobalSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Data início</Label>
              <Input type="date" value={filtros.dataInicio} onChange={(e) => handleFiltroChange('dataInicio', e.target.value)} className="h-9 text-sm border-border/50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Data fim</Label>
              <Input type="date" value={filtros.dataFim} onChange={(e) => handleFiltroChange('dataFim', e.target.value)} className="h-9 text-sm border-border/50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={filtros.tipo} onValueChange={(value) => handleFiltroChange('tipo', value)}>
                <SelectTrigger className="h-9 text-sm border-border/50">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="colaborador">Colaborador</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="marinheiro">Marinheiro</SelectItem>
                  <SelectItem value="prestador">Prestador de Serviço</SelectItem>
                  <SelectItem value="proprietario">Proprietário</SelectItem>
                  <SelectItem value="visita">Visita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input placeholder="Buscar por nome..." value={filtros.nome} onChange={(e) => handleFiltroChange('nome', e.target.value)} className="h-9 text-sm border-border/50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Documento</Label>
              <Input placeholder="CPF, RG..." value={filtros.documento} onChange={(e) => handleFiltroChange('documento', e.target.value)} className="h-9 text-sm border-border/50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Placa</Label>
              <Input placeholder="ABC-1234" value={filtros.placa} onChange={(e) => handleFiltroChange('placa', e.target.value.toUpperCase())} className="h-9 text-sm border-border/50" />
            </div>
          </div>

          {dadosFiltrados.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {viewMode === 'list' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Registros por página:</span>
                      <Select value={pagination.list.pageSize.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
                        <SelectTrigger className="w-20 h-8 text-sm border-border/50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="75">75</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {viewMode === 'daily' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Dias por página:</span>
                      <Select value={pagination.daily.pageSize.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
                        <SelectTrigger className="w-20 h-8 text-sm border-border/50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="75">75</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {viewMode === 'list' && (
                    <>Mostrando {Math.min((pagination.list.page - 1) * pagination.list.pageSize + 1, dadosFiltrados.length)} a {Math.min(pagination.list.page * pagination.list.pageSize, dadosFiltrados.length)} de {dadosFiltrados.length} registros</>
                  )}
                  {viewMode === 'daily' && (
                    <>Mostrando {Math.min((pagination.daily.page - 1) * pagination.daily.pageSize + 1, movimentacoesPorDia.length)} a {Math.min(pagination.daily.page * pagination.daily.pageSize, movimentacoesPorDia.length)} de {movimentacoesPorDia.length} dias</>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            DAILY VIEW
        ════════════════════════════════════════════════════════════════ */}
        {viewMode === 'daily' ? (
          <div className="space-y-4">
            {movimentacoesPorDia.length === 0 ? (
              <div className="card-elevated p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                  <CalendarDays className="h-8 w-8 text-black" />
                </div>
                <h4 className="font-medium text-black mb-1">Nenhum registro encontrado</h4>
                <p className="text-sm text-black">
                  {hasActiveFilters ? 'Tente ajustar os filtros de busca' : 'O histórico aparecerá aqui conforme as movimentações forem registradas'}
                </p>
              </div>
            ) : (
              <>
                {getPaginatedItems(movimentacoesPorDia, pagination.daily.page, pagination.daily.pageSize).map((dia, diaIndex) => (
                  <div key={dia.data} className="card-elevated animate-fade-in" style={{ animationDelay: `${diaIndex * 100}ms` }}>
                    {/* Day Header */}
                    <div className="p-4 md:p-5 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 flex-shrink-0">
                            <CalendarDays className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base md:text-lg text-foreground">{dia.dataFormatada}</h3>
                            <p className="text-sm text-black">
                              {dia.totalEntradas} entrada{dia.totalEntradas !== 1 ? 's' : ''}
                              {dia.dentroAgora > 0 && (
                                <span className="ml-2 text-success font-medium">• {dia.dentroAgora} dentro</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDayExpansion(dia.data)}
                          className="gap-1.5 text-sm flex-shrink-0"
                        >
                          <span className={cn("transition-transform duration-200", isDayExpanded(dia.data) ? "rotate-180" : "rotate-0")}>
                            <ChevronDown className="h-4 w-4" />
                          </span>
                          <span className="hidden sm:inline">{isDayExpanded(dia.data) ? 'Recolher' : 'Expandir'}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Day Movements */}
                    <div className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      isDayExpanded(dia.data) ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
                    )}>
                      {/* Paginação interna do dia */}
                      {dia.totalEntradas > 10 && isDayExpanded(dia.data) && (
                        <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDayPageChange(dia.data, getDayPagination(dia.data).page - 1)}
                              disabled={getDayPagination(dia.data).page <= 1}
                              className="h-7 px-2"
                            >
                              <ChevronDown className="h-4 w-4 rotate-90" />
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {getDayPagination(dia.data).page} / {getTotalPages(dia.totalEntradas, getDayPagination(dia.data).pageSize)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDayPageChange(dia.data, getDayPagination(dia.data).page + 1)}
                              disabled={getDayPagination(dia.data).page >= getTotalPages(dia.totalEntradas, getDayPagination(dia.data).pageSize)}
                              className="h-7 px-2"
                            >
                              <ChevronDown className="h-4 w-4 -rotate-90" />
                            </Button>
                          </div>
                          <Select 
                            value={getDayPagination(dia.data).pageSize.toString()} 
                            onValueChange={(value) => handleDayPageSizeChange(dia.data, parseInt(value))}
                          >
                            <SelectTrigger className="w-20 h-7 text-xs border-border/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="15">15</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="divide-y divide-border">
                        {getPaginatedItems(dia.movimentacoes, getDayPagination(dia.data).page, getDayPagination(dia.data).pageSize).map((mov) => {
                          const isDailyItemExpanded = expandedDailyItems.has(mov.id);
                          return (
                            <React.Fragment key={mov.id}>
                              {/* ── Mobile Daily Item Card (≤750px) ── */}
                              <div
                                className="block min-[751px]:hidden p-3 cursor-pointer select-none active:bg-muted/40 transition-colors"
                                onClick={() => toggleDailyItem(mov.id)}
                              >
                                {/* Top row */}
                                <div className="flex items-center gap-3 mb-2">
                                  <UserTypeAvatar pessoa={mov.pessoa} />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-black text-base truncate leading-tight">
                                      {mov.pessoa.nome}
                                    </p>
                                    {/* Observação sempre visível abaixo do nome */}
                                    {mov.observacao ? (
                                      <p className="text-xs text-black/70 mt-0.5 line-clamp-2 whitespace-pre-wrap">
                                        {mov.observacao}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-red-500 font-medium mt-0.5">⚠️ Observação obrigatória</p>
                                    )}
                                  </div>
                                  {/* Chevron indicator */}
                                  <div className="text-black/40 flex-shrink-0 transition-transform duration-200" style={{ transform: isDailyItemExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    <ChevronDown className="h-4 w-4" />
                                  </div>
                                </div>

                                {/* Status + tipo + entrada — sempre visível */}
                                <div className="flex items-center gap-2 pl-11 mb-3 flex-wrap">
                                  {mov.pessoa.tipo && (
                                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                      {mov.pessoa.tipo.charAt(0).toUpperCase() + mov.pessoa.tipo.slice(1)}
                                    </span>
                                  )}
                                  <span className={cn(
                                    "text-xs font-medium flex items-center gap-1",
                                    mov.status === 'DENTRO' ? "text-success" : "text-muted-foreground"
                                  )}>
                                    <span className={cn("h-1.5 w-1.5 rounded-full inline-block", mov.status === 'DENTRO' ? "bg-success animate-pulse-soft" : "bg-muted-foreground")} />
                                    {mov.status === 'DENTRO' ? 'Dentro' : 'Saiu'}
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-black">
                                    <LogIn className="h-3 w-3 text-success" />
                                    {formatTime(mov.entrada_em)}
                                  </span>
                                  {mov.saida_em && (
                                    <span className="flex items-center gap-1 text-xs text-black">
                                      <LogOut className="h-3 w-3 text-destructive" />
                                      {formatTime(mov.saida_em)}
                                    </span>
                                  )}
                                </div>

                                {/* Expandable details */}
                                {isDailyItemExpanded && (
                                  <div className="pl-11 mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                                    <div>
                                      <p className="text-xs text-black/50 uppercase tracking-wide font-medium mb-0.5">Documento</p>
                                      <p className="text-black text-xs">{mov.pessoa.documento || '—'}</p>
                                    </div>
                                    {(mov.placa || mov.pessoa.placa) && (
                                      <div>
                                        <p className="text-xs text-black/50 uppercase tracking-wide font-medium mb-0.5">Placa</p>
                                        <p className="font-mono bg-muted px-2 py-0.5 rounded text-xs inline-block">
                                          {formatters.placa(mov.placa || mov.pessoa.placa || '')}
                                        </p>
                                      </div>
                                    )}
                                    {mov.pessoa.contato && (
                                      <div>
                                        <p className="text-xs text-black/50 uppercase tracking-wide font-medium mb-0.5">Contato</p>
                                        <p className="text-black text-xs">{mov.pessoa.contato}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Action buttons — stop propagation */}
                                <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="default"
                                    variant="outline"
                                    onClick={() => setEditandoMovimentacao(mov)}
                                    className="gap-2 h-11 text-sm font-medium w-full"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Editar
                                  </Button>
                                  {mov.status === 'DENTRO' ? (
                                    <Button
                                      size="default"
                                      variant="destructive"
                                      onClick={() => setSaidaModal({ open: true, pessoa: { movimentacaoId: mov.id, pessoa: mov.pessoa, entradaEm: mov.entrada_em } })}
                                      className="gap-2 h-11 text-sm font-medium w-full"
                                    >
                                      <LogOut className="h-4 w-4" />
                                      Saída
                                    </Button>
                                  ) : (
                                    <div />
                                  )}
                                </div>
                              </div>

                              {/* ── Desktop Daily Item (≥751px) ── */}
                              <div
                                className="hidden min-[751px]:block p-5 hover:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => {
                                  const details = document.getElementById(`details-daily-${mov.id}`);
                                  if (details) {
                                    details.style.display = details.style.display === 'none' || !details.style.display ? 'block' : 'none';
                                  }
                                }}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <UserTypeAvatar pessoa={mov.pessoa} />
                                    <div className="flex-1 min-w-0 space-y-2">
                                      <div>
                                        <p className="font-medium text-foreground truncate">{mov.pessoa.nome}</p>
                                        <div className="flex items-center gap-2 text-sm text-black">
                                          <FileText className="h-3.5 w-3.5" />
                                          <span>{mov.pessoa.documento}</span>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-4 text-sm">
                                        {mov.pessoa.tipo && (
                                          <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                                            {mov.pessoa.tipo.charAt(0).toUpperCase() + mov.pessoa.tipo.slice(1)}
                                          </span>
                                        )}
                                        {mov.pessoa.contato && (
                                          <div className="flex items-center gap-1 text-black">
                                            <Phone className="h-3 w-3" />
                                            <span>{mov.pessoa.contato}</span>
                                          </div>
                                        )}
                                        {(mov.placa || mov.pessoa.placa) && (
                                          <div className="flex items-center gap-2">
                                            <Car className="h-3 w-3 text-black" />
                                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                              {formatters.placa(mov.placa || mov.pessoa.placa || '')}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                          <LogIn className="h-4 w-4 text-success" />
                                          <div>
                                            <p className="font-medium text-black">{formatDate(mov.entrada_em)}</p>
                                            <p className="text-xs text-black">{formatTime(mov.entrada_em)}</p>
                                          </div>
                                        </div>
                                        {mov.saida_em && (
                                          <div className="flex items-center gap-2">
                                            <LogOut className="h-4 w-4 text-destructive" />
                                            <div>
                                              <p className="font-medium text-black">{formatDate(mov.saida_em)}</p>
                                              <p className="text-xs text-black">{formatTime(mov.saida_em)}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                    <span className={mov.status === 'DENTRO' ? 'status-inside' : 'status-outside'}>
                                      <span className={cn("h-2 w-2 rounded-full", mov.status === 'DENTRO' ? "bg-success animate-pulse-soft" : "bg-muted-foreground")} />
                                      {mov.status === 'DENTRO' ? 'Dentro' : 'Saiu'}
                                    </span>
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                      {mov.status === 'DENTRO' && (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => setSaidaModal({ open: true, pessoa: { movimentacaoId: mov.id, pessoa: mov.pessoa, entradaEm: mov.entrada_em } })}
                                          className="gap-1.5"
                                        >
                                          <LogOut className="h-3.5 w-3.5" />
                                          <span>Saída</span>
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditandoMovimentacao(mov)}
                                        className="gap-1.5"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                        <span>Editar</span>
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Desktop details row */}
                              <div
                                id={`details-daily-${mov.id}`}
                                className="hidden min-[751px]:block p-5 bg-muted/20 border-t border-border"
                                style={{ display: 'none' }}
                              >
                                <div className="flex items-start gap-3">
                                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1">
                                    {mov.observacao ? (
                                      <p className="text-sm text-black whitespace-pre-wrap">{mov.observacao}</p>
                                    ) : (
                                      <p className="text-sm text-red-600 font-medium"></p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                <PaginationBar
                  total={movimentacoesPorDia.length}
                  page={pagination.daily.page}
                  pageSize={pagination.daily.pageSize}
                  label="dias"
                />
              </>
            )}
          </div>

        ) : (
          /* ════════════════════════════════════════════════════════════════
              LIST VIEW
          ════════════════════════════════════════════════════════════════ */
          <div className="space-y-4">
            <div className="card-elevated-md overflow-hidden">
              {dadosFiltrados.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                    <History className="h-8 w-8 text-black" />
                  </div>
                  <h4 className="font-medium text-black mb-1">Nenhum registro encontrado</h4>
                  <p className="text-sm text-black">
                    {hasActiveFilters ? 'Tente ajustar os filtros de busca' : 'O histórico aparecerá aqui conforme as movimentações forem registradas'}
                  </p>
                </div>
              ) : (
                <>
                  {/* ── Mobile List Cards (≤750px) ── */}
                  <div className="block min-[751px]:hidden divide-y divide-border">
                    {getPaginatedItems(dadosFiltrados, pagination.list.page, pagination.list.pageSize).map((mov, index) => {
                      const isExpanded = expandedListCards.has(mov.id);
                      return (
                        <div
                          key={mov.id}
                          className="p-3 animate-fade-in cursor-pointer select-none active:bg-muted/40 transition-colors"
                          style={{ animationDelay: `${index * 30}ms` }}
                          onClick={() => toggleListCard(mov.id)}
                        >
                          {/* Top row */}
                          <div className="flex items-center gap-3 mb-2">
                            <UserTypeAvatar pessoa={mov.pessoa} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-black text-base truncate leading-tight">
                                {mov.pessoa.nome}
                              </p>
                              {/* Observação sempre visível abaixo do nome */}
                              {mov.observacao ? (
                                <p className="text-xs text-black/70 mt-0.5 line-clamp-2 whitespace-pre-wrap">
                                  {mov.observacao}
                                </p>
                              ) : (
                                <p className="text-xs text-red-500 font-medium mt-0.5">⚠️ Observação obrigatória</p>
                              )}
                            </div>
                            {/* Chevron indicator */}
                            <div className="text-black/40 flex-shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                              <ChevronDown className="h-4 w-4" />
                            </div>
                          </div>

                          {/* Status + tipo + datas — sempre visível */}
                          <div className="flex items-center gap-2 pl-11 mb-3 flex-wrap text-sm">
                            {mov.pessoa.tipo && (
                              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {mov.pessoa.tipo.charAt(0).toUpperCase() + mov.pessoa.tipo.slice(1)}
                              </span>
                            )}
                            <span className={cn(
                              "text-xs font-medium flex items-center gap-1",
                              mov.status === 'DENTRO' ? "text-success" : "text-muted-foreground"
                            )}>
                              <span className={cn("h-1.5 w-1.5 rounded-full inline-block", mov.status === 'DENTRO' ? "bg-success animate-pulse-soft" : "bg-muted-foreground")} />
                              {mov.status === 'DENTRO' ? 'Dentro' : 'Saiu'}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-black">
                              <LogIn className="h-3 w-3 text-success" />
                              {formatDate(mov.entrada_em)} {formatTime(mov.entrada_em)}
                            </span>
                            {mov.saida_em && (
                              <span className="flex items-center gap-1 text-xs text-black">
                                <LogOut className="h-3 w-3 text-destructive" />
                                {formatDate(mov.saida_em)} {formatTime(mov.saida_em)}
                              </span>
                            )}
                          </div>

                          {/* Expandable details */}
                          {isExpanded && (
                            <div className="pl-11 mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                              <div>
                                <p className="text-xs text-black/50 uppercase tracking-wide font-medium mb-0.5">Documento</p>
                                <p className="text-black text-xs">{mov.pessoa.documento || '—'}</p>
                              </div>
                              {(mov.placa || mov.pessoa.placa) && (
                                <div>
                                  <p className="text-xs text-black/50 uppercase tracking-wide font-medium mb-0.5">Placa</p>
                                  <p className="font-mono bg-muted px-2 py-0.5 rounded text-xs inline-block">
                                    {formatters.placa(mov.placa || mov.pessoa.placa || '')}
                                  </p>
                                </div>
                              )}
                              {mov.pessoa.contato && (
                                <div>
                                  <p className="text-xs text-black/50 uppercase tracking-wide font-medium mb-0.5">Contato</p>
                                  <p className="text-black text-xs">{mov.pessoa.contato}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action buttons — stop propagation */}
                          <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="default"
                              variant="outline"
                              onClick={() => setEditandoMovimentacao(mov)}
                              className="gap-2 h-11 text-sm font-medium w-full"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </Button>
                            {mov.status === 'DENTRO' ? (
                              <Button
                                size="default"
                                variant="destructive"
                                onClick={() => setSaidaModal({ open: true, pessoa: { movimentacaoId: mov.id, pessoa: mov.pessoa, entradaEm: mov.entrada_em } })}
                                className="gap-2 h-11 text-sm font-medium w-full"
                              >
                                <LogOut className="h-4 w-4" />
                                Saída
                              </Button>
                            ) : (
                              <div />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Desktop Table (≥751px) ── */}
                  <div className="hidden min-[751px]:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-center py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">Pessoa</th>
                          <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">Documento</th>
                          <th className="text-center py-3 px-5 text-xs font-medium text-black uppercase tracking-wider hidden lg:table-cell">Placa</th>
                          <th className="text-center py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">Entrada</th>
                          <th className="text-center py-3 px-5 text-xs font-medium text-black uppercase tracking-wider hidden md:table-cell">Saída</th>
                          <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">Status</th>
                          <th className="text-center py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {getPaginatedItems(dadosFiltrados, pagination.list.page, pagination.list.pageSize).map((mov, index) => (
                          <React.Fragment key={mov.id}>
                            <tr
                              className="hover:bg-muted/30 transition-smooth animate-fade-in cursor-pointer"
                              style={{ animationDelay: `${index * 30}ms` }}
                              onClick={() => {
                                const details = document.getElementById(`details-list-${mov.id}`);
                                if (details) {
                                  details.style.display = details.style.display === 'none' || !details.style.display ? 'table-row' : 'none';
                                }
                              }}
                            >
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                  <UserTypeAvatar pessoa={mov.pessoa} />
                                  <div className="min-w-0">
                                    <p className="font-medium text-black truncate">{mov.pessoa.nome}</p>
                                    {mov.observacao && (
                                      <p className="text-xs text-black whitespace-pre-wrap mt-1 max-w-[300px] truncate">{mov.observacao}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-2 text-sm text-black">
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>{mov.pessoa.documento}</span>
                                </div>
                              </td>
                              <td className="py-4 px-5 hidden lg:table-cell">
                                {(mov.placa || mov.pessoa.placa) ? (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Car className="h-3.5 w-3.5 text-black" />
                                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                      {formatters.placa(mov.placa || mov.pessoa.placa || '')}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-black">—</span>
                                )}
                              </td>
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-2">
                                  <LogIn className="h-3.5 w-3.5 text-success" />
                                  <div>
                                    <p className="text-sm font-medium">{formatDate(mov.entrada_em)}</p>
                                    <p className="text-xs text-black">{formatTime(mov.entrada_em)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-5 hidden md:table-cell">
                                {mov.saida_em ? (
                                  <div className="flex items-center gap-2">
                                    <LogOut className="h-3.5 w-3.5 text-destructive" />
                                    <div>
                                      <p className="text-sm font-medium">{formatDate(mov.saida_em)}</p>
                                      <p className="text-xs text-black">{formatTime(mov.saida_em)}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-4 px-5">
                                <span className={mov.status === 'DENTRO' ? 'status-inside' : 'status-outside'}>
                                  <span className={cn("h-1.5 w-1.5 rounded-full", mov.status === 'DENTRO' ? "bg-success animate-pulse-soft" : "bg-muted-foreground")} />
                                  {mov.status === 'DENTRO' ? 'Dentro' : 'Saiu'}
                                </span>
                              </td>
                              <td className="py-4 px-5 text-right">
                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                  {mov.status === 'DENTRO' && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => setSaidaModal({ open: true, pessoa: { movimentacaoId: mov.id, pessoa: mov.pessoa, entradaEm: mov.entrada_em } })}
                                      className="gap-1.5"
                                    >
                                      <LogOut className="h-3.5 w-3.5" />
                                      <span>Saída</span>
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditandoMovimentacao(mov)}
                                    className="gap-1.5"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                    <span>Editar</span>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            <tr id={`details-list-${mov.id}`} className="hover:bg-muted/30 transition-smooth" style={{ display: 'none' }}>
                              <td colSpan={7} className="p-4">
                                <div className="flex items-start gap-3">
                                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1">
                                    {mov.observacao ? (
                                      <p className="text-sm text-black whitespace-pre-wrap">{mov.observacao}</p>
                                    ) : (
                                      <p className="text-sm text-red-600 font-medium"></p>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <PaginationBar
                    total={dadosFiltrados.length}
                    page={pagination.list.page}
                    pageSize={pagination.list.pageSize}
                    label="registros"
                  />
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <EditarPessoaModal
        open={editandoPessoa !== null}
        onOpenChange={(open) => !open && setEditandoPessoa(null)}
        pessoa={editandoPessoa}
      />
      <RegistrarSaidaPersonalizadaModal
        open={saidaModal.open}
        onOpenChange={(open) => setSaidaModal({ open, pessoa: saidaModal.pessoa })}
        pessoaDentro={saidaModal.pessoa}
      />
      <EditarMovimentacaoModal
        open={editandoMovimentacao !== null}
        onOpenChange={(open) => !open && setEditandoMovimentacao(null)}
        movimentacao={editandoMovimentacao}
      />

      {/* Botão flutuante para rolar até o topo */}
      <Button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-lg transition-all duration-300 ease-in-out ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        variant="default"
        size="icon"
      >
        <ArrowUp className="h-6 w-6" />
      </Button>
    </div>
  );
}