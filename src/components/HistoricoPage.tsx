import { useState, useMemo } from 'react';
import { useMarina } from '@/contexts/MarinaContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EditarPessoaModal } from '@/components/modals/EditarPessoaModal';
import { RegistrarSaidaHistoricoModal } from '@/components/modals/RegistrarSaidaHistoricoModal';
import { UserTypeIcon, UserTypeAvatar } from '@/lib/userTypeIcons';
import { Pessoa, MovimentacaoComPessoa, PessoaDentro } from '@/types/marina';
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
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function HistoricoPage() {
  const { getHistoricoMovimentacoes } = useMarina();
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    nome: '',
    documento: '',
    placa: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editandoPessoa, setEditandoPessoa] = useState<Pessoa | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'daily'>('list');
  const [saidaModal, setSaidaModal] = useState<{ open: boolean; pessoa: PessoaDentro | null }>({
    open: false,
    pessoa: null,
  });

  // Pagination states
  const [listCurrentPage, setListCurrentPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(20);
  const [dailyCurrentPage, setDailyCurrentPage] = useState(1);
  const [dailyPageSize, setDailyPageSize] = useState(10);

  const movimentacoes = getHistoricoMovimentacoes({
    dataInicio: filtros.dataInicio || undefined,
    dataFim: filtros.dataFim || undefined,
    nome: filtros.nome || undefined,
    documento: filtros.documento || undefined,
    placa: filtros.placa || undefined,
  });

  const hasActiveFilters = Object.values(filtros).some(v => v !== '');



  const clearFilters = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      nome: '',
      documento: '',
      placa: '',
    });
  };

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

  // Pagination helpers
  const getPaginatedItems = (items: any[], currentPage: number, pageSize: number) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number, pageSize: number) => {
    return Math.ceil(totalItems / pageSize);
  };

  // Agrupar movimentações por dia
  const movimentacoesPorDia = useMemo(() => {
    const grupos: { [key: string]: MovimentacaoComPessoa[] } = {};

    movimentacoes.forEach(mov => {
      const data = format(new Date(mov.entrada_em), 'yyyy-MM-dd');
      if (!grupos[data]) {
        grupos[data] = [];
      }
      grupos[data].push(mov);
    });

    // Ordenar dias em ordem decrescente (mais recente primeiro)
    return Object.entries(grupos)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([data, movs]) => ({
        data,
        dataFormatada: formatDate(movs[0].entrada_em),
        movimentacoes: movs.sort((a, b) =>
          new Date(b.entrada_em).getTime() - new Date(a.entrada_em).getTime()
        ),
        totalEntradas: movs.length,
        dentroAgora: movs.filter(m => m.status === 'DENTRO').length,
      }));
  }, [movimentacoes, formatDate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-1 flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              Histórico de Movimentações
            </h2>
            <p className="text-black">
              {movimentacoes.length} registro{movimentacoes.length !== 1 ? 's' : ''} encontrado{movimentacoes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            {/* Toggle View Mode */}
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

            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs">
                  !
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Filters panel */}
        <div className="card-elevated p-5 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center gap-2">
              <Search className="h-4 w-4 text-black" />
              Filtrar registros
            </h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-black">
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1 text-black">
                <Calendar className="h-3 w-3" />
                Data início
              </Label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1 text-black">
                <Calendar className="h-3 w-3" />
                Data fim
              </Label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1 text-black">
                <FileText className="h-3 w-3" />
                Nome
              </Label>
              <Input
                placeholder="Buscar por nome..."
                value={filtros.nome}
                onChange={(e) => setFiltros(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1 text-black">
                <FileText className="h-3 w-3" />
                Documento
              </Label>
              <Input
                placeholder="CPF, RG..."
                value={filtros.documento}
                onChange={(e) => setFiltros(prev => ({ ...prev, documento: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1 text-black">
                <Car className="h-3 w-3" />
                Placa
              </Label>
              <Input
                placeholder="ABC-1234"
                value={filtros.placa}
                onChange={(e) => setFiltros(prev => ({ ...prev, placa: e.target.value.toUpperCase() }))}
              />
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'daily' ? (
          /* Daily View */
          <div className="space-y-4">
            {/* Pagination controls for daily view */}
            {movimentacoesPorDia.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-black">Dias por página:</span>
                  <Select
                    value={dailyPageSize.toString()}
                    onValueChange={(value) => {
                      setDailyPageSize(parseInt(value));
                      setDailyCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-black">
                  Mostrando {Math.min((dailyCurrentPage - 1) * dailyPageSize + 1, movimentacoesPorDia.length)} a{' '}
                  {Math.min(dailyCurrentPage * dailyPageSize, movimentacoesPorDia.length)} de {movimentacoesPorDia.length} dias
                </div>
              </div>
            )}

            {movimentacoesPorDia.length === 0 ? (
              <div className="card-elevated p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                  <CalendarDays className="h-8 w-8 text-black" />
                </div>
                <h4 className="font-medium text-black mb-1">Nenhum registro encontrado</h4>
                <p className="text-sm text-black">
                  {hasActiveFilters
                    ? 'Tente ajustar os filtros de busca'
                    : 'O histórico aparecerá aqui conforme as movimentações forem registradas'}
                </p>
              </div>
            ) : (
              <>
                {getPaginatedItems(movimentacoesPorDia, dailyCurrentPage, dailyPageSize).map((dia, diaIndex) => (
                  <div
                    key={dia.data}
                    className="card-elevated animate-fade-in"
                    style={{ animationDelay: `${diaIndex * 100}ms` }}
                  >
                    {/* Day Header */}
                    <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                            <CalendarDays className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-foreground">{dia.dataFormatada}</h3>
                            <p className="text-sm text-black">
                              {dia.totalEntradas} entrada{dia.totalEntradas !== 1 ? 's' : ''}
                              {dia.dentroAgora > 0 && (
                                <span className="ml-2 text-success font-medium">
                                  • {dia.dentroAgora} ainda dentro
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm">
                            <LogIn className="h-4 w-4 text-success" />
                            <span className="font-medium text-success">{dia.totalEntradas}</span>
                          </div>
                          {dia.dentroAgora > 0 && (
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <div className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
                              <span className="text-success">{dia.dentroAgora}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Day Movements */}
                    <div className="divide-y divide-border">
                      {dia.movimentacoes.map((mov, movIndex) => (
                        <div
                          key={mov.id}
                          className="p-5 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Left side - Person info */}
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <UserTypeAvatar pessoa={mov.pessoa} />
                              <div className="flex-1 min-w-0 space-y-2">
                                {/* Name and document */}
                                <div>
                                  <p className="font-medium text-foreground truncate">
                                    {mov.pessoa.nome}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-black">
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>{mov.pessoa.documento}</span>
                                  </div>
                                </div>

                                {/* Type and contact */}
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

                                  {mov.pessoa.placa && (
                                    <div className="flex items-center gap-2">
                                      <Car className="h-3 w-3 text-black" />
                                      <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                        {mov.pessoa.placa}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Times */}
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

                                {/* Observation */}
                                {mov.observacao && (
                                  <div className="flex items-start gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-black">
                                      {mov.observacao}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right side - Status and actions */}
                            <div className="flex flex-col items-end gap-3 flex-shrink-0">
                              <span className={mov.status === 'DENTRO' ? 'status-inside' : 'status-outside'}>
                                <span className={cn(
                                  "h-2 w-2 rounded-full",
                                  mov.status === 'DENTRO' ? "bg-success animate-pulse-soft" : "bg-muted-foreground"
                                )} />
                                {mov.status === 'DENTRO' ? 'Dentro' : 'Saiu'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Pagination for daily view */}
                      {getTotalPages(movimentacoesPorDia.length, dailyPageSize) > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-black">
                            Mostrando dias {Math.min((dailyCurrentPage - 1) * dailyPageSize + 1, movimentacoesPorDia.length)} a{' '}
                            {Math.min(dailyCurrentPage * dailyPageSize, movimentacoesPorDia.length)} de {movimentacoesPorDia.length}
                          </div>
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  onClick={() => dailyCurrentPage > 1 && setDailyCurrentPage(dailyCurrentPage - 1)}
                                  className={dailyCurrentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                              </PaginationItem>

                              {/* Page numbers */}
                              {Array.from({ length: Math.min(5, getTotalPages(movimentacoesPorDia.length, dailyPageSize)) }, (_, i) => {
                                const totalPages = getTotalPages(movimentacoesPorDia.length, dailyPageSize);
                                let pageNum;

                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (dailyCurrentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (dailyCurrentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = dailyCurrentPage - 2 + i;
                                }

                                return (
                                  <PaginationItem key={pageNum}>
                                    <PaginationLink
                                      onClick={() => setDailyCurrentPage(pageNum)}
                                      isActive={dailyCurrentPage === pageNum}
                                      className="cursor-pointer"
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              })}

                              <PaginationItem>
                                <PaginationNext
                                  onClick={() => dailyCurrentPage < getTotalPages(movimentacoesPorDia.length, dailyPageSize) && setDailyCurrentPage(dailyCurrentPage + 1)}
                                  className={dailyCurrentPage >= getTotalPages(movimentacoesPorDia.length, dailyPageSize) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          /* List View (Table) */
          <div className="space-y-4">
            {/* Pagination controls for list view */}
            {movimentacoes.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-black">Itens por página:</span>
                  <Select
                    value={listPageSize.toString()}
                    onValueChange={(value) => {
                      setListPageSize(parseInt(value));
                      setListCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-black">
                  Mostrando {Math.min((listCurrentPage - 1) * listPageSize + 1, movimentacoes.length)} a{' '}
                  {Math.min(listCurrentPage * listPageSize, movimentacoes.length)} de {movimentacoes.length} registros
                </div>
              </div>
            )}

            <div className="card-elevated-md overflow-hidden">
              {movimentacoes.length === 0 ? (
                <div className="p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                  <History className="h-8 w-8 text-black" />
                </div>
                <h4 className="font-medium text-black mb-1">Nenhum registro encontrado</h4>
                <p className="text-sm text-black">
                    {hasActiveFilters
                      ? 'Tente ajustar os filtros de busca'
                      : 'O histórico aparecerá aqui conforme as movimentações forem registradas'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">
                            Pessoa
                          </th>
                          <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider hidden sm:table-cell">
                            Documento
                          </th>
                          <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider hidden lg:table-cell">
                            Placa
                          </th>
                          <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">
                            Entrada
                          </th>
                          <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider hidden md:table-cell">
                            Saída
                          </th>
                          <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-right py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">
                            Ação
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {getPaginatedItems(movimentacoes, listCurrentPage, listPageSize).map((mov, index) => (
                          <tr
                            key={mov.id}
                            className="hover:bg-muted/30 transition-smooth animate-fade-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <UserTypeAvatar pessoa={mov.pessoa} />
                                <div className="min-w-0">
                                  <p className="font-medium text-black truncate">
                                    {mov.pessoa.nome}
                                  </p>
                                  {mov.observacao && (
                                    <p className="text-xs text-black truncate max-w-[200px]">
                                      {mov.observacao}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-5 hidden sm:table-cell">
                              <div className="flex items-center gap-2 text-sm text-black">
                                <FileText className="h-3.5 w-3.5" />
                                <span>{mov.pessoa.documento}</span>
                              </div>
                            </td>
                            <td className="py-4 px-5 hidden lg:table-cell">
                              {mov.pessoa.placa ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <Car className="h-3.5 w-3.5 text-black" />
                                  <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                    {mov.pessoa.placa}
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
                                <span className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  mov.status === 'DENTRO' ? "bg-success animate-pulse-soft" : "bg-muted-foreground"
                                )} />
                                {mov.status === 'DENTRO' ? 'Dentro' : 'Saiu'}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex justify-end gap-2">
                                {mov.status === 'DENTRO' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setSaidaModal({ open: true, pessoa: { movimentacaoId: mov.id, pessoa: mov.pessoa, entradaEm: mov.entrada_em } })}
                                    className="gap-1.5"
                                  >
                                    <LogOut className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Saída</span>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditandoPessoa(mov.pessoa)}
                                  className="gap-1.5"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Editar</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                    {/* Pagination for list view */}
                    {getTotalPages(movimentacoes.length, listPageSize) > 1 && (
                      <div className="flex items-center justify-between p-4 border-t border-border">
                        <div className="text-sm text-black">
                          Mostrando {Math.min((listCurrentPage - 1) * listPageSize + 1, movimentacoes.length)} a{' '}
                          {Math.min(listCurrentPage * listPageSize, movimentacoes.length)} de {movimentacoes.length} registros
                        </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => listCurrentPage > 1 && setListCurrentPage(listCurrentPage - 1)}
                              className={listCurrentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>

                          {/* Page numbers */}
                          {Array.from({ length: Math.min(5, getTotalPages(movimentacoes.length, listPageSize)) }, (_, i) => {
                            const totalPages = getTotalPages(movimentacoes.length, listPageSize);
                            let pageNum;

                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (listCurrentPage <= 3) {
                              pageNum = i + 1;
                            } else if (listCurrentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = listCurrentPage - 2 + i;
                            }

                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => setListCurrentPage(pageNum)}
                                  isActive={listCurrentPage === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => listCurrentPage < getTotalPages(movimentacoes.length, listPageSize) && setListCurrentPage(listCurrentPage + 1)}
                              className={listCurrentPage >= getTotalPages(movimentacoes.length, listPageSize) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
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
      <RegistrarSaidaHistoricoModal
        open={saidaModal.open}
        onOpenChange={(open) => setSaidaModal({ open, pessoa: saidaModal.pessoa })}
        pessoaDentro={saidaModal.pessoa}
      />
    </div>
  );
}