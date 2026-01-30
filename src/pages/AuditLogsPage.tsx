import { useState, useEffect } from 'react';
import { useAudit, useAuditLog } from '@/hooks/useAudit';
import { useMarina } from '@/contexts/MarinaContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Search, 
  Download, 
  Users, 
  FileText, 
  Clock, 
  Eye, 
  Filter,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AuditAction, AuditEntityType, AuditLog } from '@/types/audit';
import { useToast } from '@/hooks/use-toast';

const auditActions = [
  { value: 'CREATE', label: 'Criar' },
  { value: 'UPDATE', label: 'Atualizar' },
  { value: 'DELETE', label: 'Excluir' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'REGISTER_ENTRADA', label: 'Registrar Entrada' },
  { value: 'REGISTER_SAIDA', label: 'Registrar Saída' },
  { value: 'CADASTRAR_PESSOA', label: 'Cadastrar Pessoa' },
  { value: 'EDITAR_PESSOA', label: 'Editar Pessoa' },
  { value: 'CADASTRAR_USUARIO', label: 'Cadastrar Usuário' },
  { value: 'EDITAR_USUARIO', label: 'Editar Usuário' },
];

const entityTypes = [
  { value: 'PESSOA', label: 'Pessoa' },
  { value: 'MOVIMENTACAO', label: 'Movimentação' },
  { value: 'USUARIO', label: 'Usuário' },
  { value: 'EMPRESA', label: 'Empresa' },
];

export function AuditLogsPage() {
  const { user } = useMarina();
  const { 
    logs, 
    summary, 
    loading, 
    error, 
    currentPage, 
    totalPages, 
    totalLogs,
    fetchLogs, 
    fetchSummary,
    exportToCSV, 
    exportToJSON, 
    clearError 
  } = useAudit();
  
  const { logAction } = useAuditLog();
  const { toast } = useToast();

  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    action: '',
    entity_type: '',
    user_id: '',
    search: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Registrar visualização da página de auditoria
    logAction('GERAR_RELATORIO', 'RELATORIO', 'audit-logs', 'Logs de Auditoria', {
      action: 'view',
      page: 'audit-logs'
    });
  }, [logAction]);

  const handleSearch = () => {
    fetchLogs(filter);
    fetchSummary(filter);
  };

  const handleClearFilters = () => {
    const clearFilter = {
      startDate: '',
      endDate: '',
      action: '',
      entity_type: '',
      user_id: '',
      search: ''
    };
    setFilter(clearFilter);
    fetchLogs(clearFilter);
    fetchSummary(clearFilter);
  };

  const handleExportCSV = () => {
    exportToCSV(logs);
    toast({
      title: "Exportação concluída",
      description: "Logs de auditoria exportados para CSV com sucesso.",
    });
  };

  const handleExportJSON = () => {
    exportToJSON(logs);
    toast({
      title: "Exportação concluída",
      description: "Logs de auditoria exportados para JSON com sucesso.",
    });
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'LOGIN':
      case 'LOGOUT':
        return <Users className="h-4 w-4" />;
      case 'CREATE':
      case 'UPDATE':
      case 'DELETE':
        return <FileText className="h-4 w-4" />;
      case 'REGISTER_ENTRADA':
      case 'REGISTER_SAIDA':
        return <Clock className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case 'LOGIN':
      case 'REGISTER_ENTRADA':
        return 'bg-green-100 text-green-800';
      case 'LOGOUT':
      case 'REGISTER_SAIDA':
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'CREATE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || (user.profile?.role !== 'admin' && user.profile?.role !== 'owner')) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-destructive" />
                Acesso Negado
              </CardTitle>
              <CardDescription>
                Você não tem permissão para visualizar os logs de auditoria.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Logs de Auditoria</h1>
            <p className="text-sm text-muted-foreground">
              Registros de todas as ações realizadas no sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Limpar
            </Button>
            <Button
              onClick={handleExportCSV}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              onClick={handleExportJSON}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar JSON
            </Button>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Ações</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(summary.by_user).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entidades</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(summary.by_entity).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações Hoje</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.recent_actions.filter(log => 
                  new Date(log.created_at).toDateString() === new Date().toDateString()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros de Busca
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search">Pesquisa</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por usuário, entidade ou detalhes..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="action">Tipo de Ação</Label>
                <Select
                  value={filter.action}
                  onValueChange={(value) => setFilter({ ...filter, action: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as ações</SelectItem>
                    {auditActions.map(action => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity_type">Tipo de Entidade</Label>
                <Select
                  value={filter.entity_type}
                  onValueChange={(value) => setFilter({ ...filter, entity_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as entidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as entidades</SelectItem>
                    {entityTypes.map(entity => (
                      <SelectItem key={entity.value} value={entity.value}>
                        {entity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                />
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleSearch} className="flex-1 gap-2">
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Erro */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-red-600">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                X
              </Button>
            </div>
          </div>
        )}

        {/* Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Registros de Auditoria
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} • Total: {totalLogs} registros
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Carregando logs...
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum log de auditoria encontrado.
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                          <Badge variant="secondary">{log.entity_type}</Badge>
                        </div>
                        <p className="font-medium">{log.entity_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.user_name} • {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{log.user_name}</p>
                      <p className="text-xs text-muted-foreground">{log.entity_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}