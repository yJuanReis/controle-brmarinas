import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useMarina } from '@/contexts/MarinaContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  History,
  Calendar,
  Table2,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  Eye,
  RotateCcw,
  Shield,
  User,
  Clock,
  Hash,
  Database,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AuditoriaRegistro {
  id: string;
  empresa_id: string;
  tabela: string;
  acao: 'INSERT' | 'UPDATE' | 'DELETE';
  dados_antigos: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  usuario_id: string | null;
  created_at: string;
  // Campos adicionais que podem existir na tabela
  ip_address?: string | null;
  user_agent?: string | null;
  nome_tabela?: string;
  registro_id?: string;
}

// Interface para dados do usuário
interface UsuarioInfo {
  id: string;
  nome: string;
  email?: string;
  role?: string;
}

interface AuditoriaFilters {
  dataInicio: string;
  dataFim: string;
  tabela: string;
  acao: string;
}

const tabelas = [
  { value: 'pessoas', label: 'Pessoas' },
  { value: 'movimentacoes', label: 'Movimentações' },
  { value: 'user_profiles', label: 'Usuários' },
  { value: 'empresas', label: 'Empresas' },
];

const acoes = [
  { value: 'INSERT', label: 'Criação', icon: Plus, color: 'text-green-600' },
  { value: 'UPDATE', label: 'Alteração', icon: Pencil, color: 'text-blue-600' },
  { value: 'DELETE', label: 'Exclusão', icon: Trash2, color: 'text-red-600' },
];

const acaoLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  INSERT: { label: 'Criação', icon: Plus, color: 'text-green-600' },
  UPDATE: { label: 'Alteração', icon: Pencil, color: 'text-blue-600' },
  DELETE: { label: 'Exclusão', icon: Trash2, color: 'text-red-600' },
};

// Mapeamento de nomes de campos para português brasileiro
const fieldLabels: Record<string, string> = {
  id: 'Código',
  nome: 'Nome',
  documento: 'Documento',
  contato: 'Contato',
  placa: 'Placa',
  tipo: 'Tipo',
  empresa_id: 'Empresa',
  pessoa_id: 'Pessoa',
  entrada_em: 'Entrada',
  saida_em: 'Saída',
  status: 'Status',
  observacao: 'Observação',
  pernoite: 'Pernoite',
  dias_pernoite: 'Dias de Pernoite',
  created_at: 'Criado em',
  updated_at: 'Atualizado em',
  excluido_em: 'Excluído em',
  role: 'Função',
  email: 'E-mail',
  user_id: 'Usuário',
};

// Formatar valor para exibição em português brasileiro
const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'object') return JSON.stringify(value);
  // Detectar datas ISO e formatar
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    try {
      return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return value;
    }
  }
  return String(value);
};

export function AuditoriaPage() {
  const { user } = useMarina();
  
  // Verificar se é admin ou owner
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  
  // DEBUG: forçar true para teste (remover após teste)
  const showAnyway = true;
  
  const [registros, setRegistros] = useState<AuditoriaRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRegistros, setTotalRegistros] = useState(0);
  
  const [filters, setFilters] = useState<AuditoriaFilters>({
    dataInicio: '',
    dataFim: '',
    tabela: '',
    acao: '',
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
  });
  
  const [selectedRegistro, setSelectedRegistro] = useState<AuditoriaRegistro | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [usuarioInfo, setUsuarioInfo] = useState<UsuarioInfo | null>(null);
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [pessoaNome, setPessoaNome] = useState<string | null>(null);
  const [loadingPessoa, setLoadingPessoa] = useState(false);

  // Buscar informações do usuário quando abrir o detalhe
  const buscarUsuario = useCallback(async (usuarioId: string | null) => {
    if (!usuarioId) {
      setUsuarioInfo(null);
      return;
    }

    setLoadingUsuario(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, nome, email, role')
        .eq('id', usuarioId)
        .single();

      if (error) {
        console.error('Erro ao buscar usuário:', error);
        setUsuarioInfo({ id: usuarioId, nome: 'Usuário desconhecido' });
        return;
      }

      setUsuarioInfo(data);
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      setUsuarioInfo({ id: usuarioId, nome: 'Usuário desconhecido' });
    } finally {
      setLoadingUsuario(false);
    }
  }, []);

  // Buscar nome da pessoa para registros de movimentação
  const buscarPessoaNome = useCallback(async (pessoaId: string | null) => {
    if (!pessoaId) {
      setPessoaNome(null);
      return;
    }

    setLoadingPessoa(true);
    try {
      const { data, error } = await supabase
        .from('pessoas')
        .select('nome')
        .eq('id', pessoaId)
        .single();

      if (error) {
        console.error('Erro ao buscar pessoa:', error);
        setPessoaNome(null);
        return;
      }

      setPessoaNome(data?.nome || null);
    } catch (err) {
      console.error('Erro ao buscar pessoa:', err);
      setPessoaNome(null);
    } finally {
      setLoadingPessoa(false);
    }
  }, []);

  // Atualizar quando abrir os detalhes
  const openDetails = (registro: AuditoriaRegistro) => {
    setSelectedRegistro(registro);
    setUsuarioInfo(null);
    setPessoaNome(null);
    setDetailsOpen(true);
    buscarUsuario(registro.usuario_id);
    
    // Buscar nome da pessoa para movimentações
    if (registro.tabela === 'movimentacoes') {
      const pessoaId = registro.dados_novos?.pessoa_id || registro.dados_antigos?.pessoa_id;
      if (pessoaId) {
        buscarPessoaNome(pessoaId as string);
      }
    }
  };

  // Função para carregar dados de auditoria
  const fetchAuditoria = useCallback(async () => {
    if (!user?.empresa_id || !isAdmin) {
      setRegistros([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('auditoria')
        .select('*', { count: 'exact' })
        .eq('empresa_id', user.empresa_id)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.tabela && filters.tabela !== '__all__') {
        query = query.eq('tabela', filters.tabela);
      }
      if (filters.acao && filters.acao !== '__all__') {
        query = query.eq('acao', filters.acao);
      }
      if (filters.dataInicio) {
        const dataInicio = new Date(filters.dataInicio);
        dataInicio.setHours(0, 0, 0, 0);
        query = query.gte('created_at', dataInicio.toISOString());
      }
      if (filters.dataFim) {
        const dataFim = new Date(filters.dataFim);
        dataFim.setHours(23, 59, 59, 999);
        query = query.lte('created_at', dataFim.toISOString());
      }

      // Aplicar paginação
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setRegistros(data || []);
      setTotalRegistros(count || 0);
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err);
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, [user?.empresa_id, isAdmin, filters, pagination.page, pagination.pageSize]);

  // Carregar dados
  useEffect(() => {
    fetchAuditoria();
  }, [fetchAuditoria]);

  // Resetar página ao mudar filtros
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters]);

  const handleFilterChange = (field: keyof AuditoriaFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dataInicio: '',
      dataFim: '',
      tabela: '',
      acao: '',
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Data inválida';
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getTotalPages = () => Math.ceil(totalRegistros / pagination.pageSize);

  // Renderizar comparação de dados
  const renderComparison = () => {
    if (!selectedRegistro) return null;

    const { dados_antigos, dados_novos, acao } = selectedRegistro;

    // Para INSERT, mostrar apenas dados novos
    if (acao === 'INSERT') {
      const campos = dados_novos ? Object.entries(dados_novos) : [];
      return (
        <div className="space-y-2">
          {campos.map(([key, value]) => (
            <div key={key} className="flex justify-between py-2 border-b border-border">
              <span className="font-medium text-muted-foreground">{fieldLabels[key] || key}</span>
              <span className="text-green-600 font-mono">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      );
    }

    // Para DELETE, mostrar apenas dados antigos
    if (acao === 'DELETE') {
      const campos = dados_antigos ? Object.entries(dados_antigos) : [];
      return (
        <div className="space-y-2">
          {campos.map(([key, value]) => (
            <div key={key} className="flex justify-between py-2 border-b border-border">
              <span className="font-medium text-muted-foreground">{fieldLabels[key] || key}</span>
              <span className="text-red-600 font-mono">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      );
    }

    // Para UPDATE, mostrar comparação
    if (acao === 'UPDATE' && dados_antigos && dados_novos) {
      const todosCampos = new Set([
        ...Object.keys(dados_antigos),
        ...Object.keys(dados_novos),
      ]);
      
      return (
        <div className="space-y-2">
          {Array.from(todosCampos).map(campo => {
            const valorAntigo = dados_antigos[campo];
            const valorNovo = dados_novos[campo];
            const alterado = JSON.stringify(valorAntigo) !== JSON.stringify(valorNovo);
            
            return (
              <div 
                key={campo} 
                className={cn(
                  "flex justify-between py-2 border-b border-border",
                  alterado && "bg-yellow-50 -mx-2 px-2 rounded"
                )}
              >
                <span className="font-medium text-muted-foreground">{fieldLabels[campo] || campo}</span>
                <div className="flex items-center gap-2">
                  {alterado && valorAntigo !== undefined && (
                    <span className="text-red-600 font-mono text-sm line-through">
                      {formatValue(valorAntigo)}
                    </span>
                  )}
                  <ArrowRight className={cn("h-3 w-3", alterado ? "text-yellow-600" : "text-muted-foreground")} />
                  <span className={cn("font-mono", alterado ? "text-green-600 font-medium" : "text-muted-foreground")}>
                    {formatValue(valorNovo)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return <p className="text-muted-foreground">Sem dados para exibir</p>;
  };

  // Se não é admin, mostrar acesso negado
  if (!isAdmin && !showAnyway) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="card-elevated p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Apenas administradores e proprietários podem acessar o histórico de auditoria.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="card-elevated p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                Histórico de Auditoria
              </h2>
              <p className="text-sm text-muted-foreground">
                {totalRegistros} registro{totalRegistros !== 1 ? 's' : ''} encontrado{totalRegistros !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Data início</Label>
              <Input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Data fim</Label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tabela</Label>
              <Select
                value={filters.tabela}
                onValueChange={(value) => handleFilterChange('tabela', value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {tabelas.map(tabela => (
                    <SelectItem key={tabela.value} value={tabela.value}>
                      {tabela.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Ação</Label>
              <Select
                value={filters.acao}
                onValueChange={(value) => handleFilterChange('acao', value)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {acoes.map(acao => (
                    <SelectItem key={acao.value} value={acao.value}>
                      {acao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end sm:col-span-2 md:col-span-1 lg:col-span-1">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="h-9 w-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela de Registros */}
        <div className="card-elevated-md overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Carregando...</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                <History className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="font-medium text-foreground mb-1">Nenhum registro encontrado</h4>
              <p className="text-sm text-muted-foreground">
                As alterações aparecerão aqui conforme forem realizadas.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-3 px-3 md:px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        Data/Hora
                      </th>
                      <th className="text-left py-3 px-3 md:px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        Ação
                      </th>
                      <th className="text-left py-3 px-3 md:px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        Tabela
                      </th>
                      <th className="text-left py-3 px-3 md:px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/3 min-w-[150px]">
                        Registro
                      </th>
                      <th className="text-center py-3 px-3 md:px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        Detalhes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {registros.map((registro) => {
                      const acaoInfo = acaoLabels[registro.acao];
                      const ActionIcon = acaoInfo.icon;
                      
                      return (
                        <tr
                          key={registro.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formatDateTime(registro.created_at)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", acaoInfo.color)}>
                              <ActionIcon className="h-4 w-4" />
                              {acaoInfo.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <Table2 className="h-4 w-4 text-muted-foreground" />
                              {tabelas.find(t => t.value === registro.tabela)?.label || registro.tabela}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {registro.tabela === 'pessoas' && (
                              <span className="text-sm font-medium">
                                {registro.dados_novos?.nome || registro.dados_antigos?.nome || '—'}
                              </span>
                            )}
                            {registro.tabela === 'movimentacoes' && (
                              <div className="text-sm">
                                <span className="font-medium">
                                  {registro.dados_novos?.pessoa_id ? `Pessoa ID: ${String(registro.dados_novos.pessoa_id).slice(0, 8)}...` : 
                                   registro.dados_antigos?.pessoa_id ? `Pessoa ID: ${String(registro.dados_antigos.pessoa_id).slice(0, 8)}...` : '—'}
                                </span>
                                {registro.dados_novos?.entrada_em && (
                                  <div className="text-xs text-muted-foreground">
                                    Entrada: {format(new Date(registro.dados_novos.entrada_em as string), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                  </div>
                                )}
                                {registro.dados_antigos?.entrada_em && !registro.dados_novos?.entrada_em && (
                                  <div className="text-xs text-muted-foreground">
                                    Entrada: {format(new Date(registro.dados_antigos.entrada_em as string), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                  </div>
                                )}
                              </div>
                            )}
                            {registro.tabela === 'user_profiles' && (
                              <span className="text-sm font-medium">
                                {registro.dados_novos?.nome || registro.dados_antigos?.nome || '—'}
                              </span>
                            )}
                            {registro.tabela === 'empresas' && (
                              <span className="text-sm font-medium">
                                {registro.dados_novos?.nome || registro.dados_antigos?.nome || '—'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetails(registro)}
                              className="gap-1.5"
                            >
                              <Eye className="h-4 w-4" />
                              Ver
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {getTotalPages() > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 md:p-4 border-t border-border">
                  <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                    Mostrando {Math.min((pagination.page - 1) * pagination.pageSize + 1, totalRegistros)} a{' '}
                    {Math.min(pagination.page * pagination.pageSize, totalRegistros)} de {totalRegistros}
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                        let pageNum: number;
                        const totalPages = getTotalPages();
                        
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                              isActive={pagination.page === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          className={pagination.page >= getTotalPages() ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal de Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[95%] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRegistro && (
                <>
                  {React.createElement(acaoLabels[selectedRegistro.acao].icon, { 
                    className: "h-5 w-5" 
                  })}
                  <span>Detalhes da Auditoria</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedRegistro && (
                <>
                  {tabelas.find(t => t.value === selectedRegistro.tabela)?.label || selectedRegistro.tabela} •{' '}
                  {acaoLabels[selectedRegistro.acao].label} •{' '}
                  {formatDateTime(selectedRegistro.created_at)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Informações Gerais da Auditoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* ID do Registro */}
              <div className="p-3 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Hash className="h-3 w-3" />
                  <span>ID do Registro</span>
                </div>
                <p className="text-sm font-mono truncate" title={selectedRegistro?.id || ''}>
                  {selectedRegistro?.id || '—'}
                </p>
              </div>

              {/* Data/Hora Completa */}
              <div className="p-3 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  <span>Data/Hora</span>
                </div>
                <p className="text-sm font-medium">
                  {selectedRegistro ? formatDateTime(selectedRegistro.created_at) : '—'}
                </p>
              </div>

              {/* Usuário */}
              <div className="p-3 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <User className="h-3 w-3" />
                  <span>Usuário Responsável</span>
                </div>
                {loadingUsuario ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : usuarioInfo ? (
                  <div>
                    <p className="text-sm font-medium">{usuarioInfo.nome}</p>
                    {usuarioInfo.role && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {usuarioInfo.role === 'owner' ? 'Proprietário' : 
                         usuarioInfo.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {selectedRegistro?.usuario_id ? `ID: ${selectedRegistro.usuario_id.slice(0, 8)}...` : 'Sistema'}
                  </p>
                )}
              </div>

              {/* Tabela */}
              <div className="p-3 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Database className="h-3 w-3" />
                  <span>Tabela Afetada</span>
                </div>
                <p className="text-sm font-medium">
                  {selectedRegistro ? tabelas.find(t => t.value === selectedRegistro.tabela)?.label || selectedRegistro.tabela : '—'}
                </p>
              </div>

              {/* Ação */}
              <div className="p-3 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <FileText className="h-3 w-3" />
                  <span>Tipo de Ação</span>
                </div>
                {selectedRegistro && (
                  <div className="flex items-center gap-2">
                    {React.createElement(acaoLabels[selectedRegistro.acao].icon, { 
                      className: "h-4 w-4" 
                    })}
                    <span className={cn("text-sm font-medium", acaoLabels[selectedRegistro.acao].color)}>
                      {acaoLabels[selectedRegistro.acao].label}
                    </span>
                  </div>
                )}
              </div>

              {/* Nome da Tabela (raw) */}
              <div className="p-3 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Table2 className="h-3 w-3" />
                  <span>Nome Técnico da Tabela</span>
                </div>
                <p className="text-sm font-mono">
                  {selectedRegistro?.tabela || '—'}
                </p>
              </div>
            </div>

            {/* Pessoa (para movimentações) */}
            {selectedRegistro?.tabela === 'movimentacoes' && (
              <div className="p-3 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <User className="h-3 w-3" />
                  <span>Pessoa</span>
                </div>
                {loadingPessoa ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : pessoaNome ? (
                  <p className="text-sm font-medium">{pessoaNome}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {selectedRegistro.dados_novos?.pessoa_id || selectedRegistro.dados_antigos?.pessoa_id 
                      ? `ID: ${String(selectedRegistro.dados_novos?.pessoa_id || selectedRegistro.dados_antigos?.pessoa_id).slice(0, 8)}...` 
                      : '—'}
                  </p>
                )}
              </div>
            )}

            {/* Endereço IP (se disponível) */}
            {selectedRegistro?.ip_address && (
              <div className="p-3 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span>Endereço IP</span>
                </div>
                <p className="text-sm font-mono">
                  {selectedRegistro.ip_address}
                </p>
              </div>
            )}

            {/* User Agent (se disponível) */}
            {selectedRegistro?.user_agent && (
              <div className="p-3 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span>Informações do Navegador</span>
                </div>
                <p className="text-sm text-muted-foreground truncate" title={selectedRegistro.user_agent}>
                  {selectedRegistro.user_agent}
                </p>
              </div>
            )}

            {/* Dados Antigos e Novos */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                {selectedRegistro?.acao === 'INSERT' && 'Dados Criados'}
                {selectedRegistro?.acao === 'UPDATE' && 'O que mudou (Antes → Depois)'}
                {selectedRegistro?.acao === 'DELETE' && 'Dados Removidos'}
              </Label>
              <div className="p-4 border border-border rounded-lg bg-background max-h-80 overflow-y-auto">
                {renderComparison()}
              </div>
            </div>

            {/* Resumo da Ação */}
            {selectedRegistro && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="text-sm font-medium text-primary mb-2">Resumo</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedRegistro.acao === 'INSERT' && (
                    <>Novo registro criado na tabela <strong>{tabelas.find(t => t.value === selectedRegistro.tabela)?.label || selectedRegistro.tabela}</strong> por <strong>{usuarioInfo?.nome || 'usuário desconhecido'}</strong>.</>
                  )}
                  {selectedRegistro.acao === 'UPDATE' && (
                    <>Registro modificado na tabela <strong>{tabelas.find(t => t.value === selectedRegistro.tabela)?.label || selectedRegistro.tabela}</strong> por <strong>{usuarioInfo?.nome || 'usuário desconhecido'}</strong>.</>
                  )}
                  {selectedRegistro.acao === 'DELETE' && (
                    <>Registro excluído da tabela <strong>{tabelas.find(t => t.value === selectedRegistro.tabela)?.label || selectedRegistro.tabela}</strong> por <strong>{usuarioInfo?.nome || 'usuário desconhecido'}</strong>.</>
                  )}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
