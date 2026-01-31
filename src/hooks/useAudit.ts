import { useState, useCallback, useEffect } from 'react';
import { auditService } from '@/services/auditService';
import { 
  AuditLog, 
  AuditAction, 
  AuditEntityType, 
  AuditFilter, 
  AuditSummary 
} from '@/types/audit';

export interface UseAuditReturn {
  // State
  logs: AuditLog[];
  summary: AuditSummary;
  loading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalLogs: number;
  
  // Actions
  fetchLogs: (filter?: AuditFilter, page?: number) => Promise<void>;
  fetchSummary: (filter?: AuditFilter) => Promise<void>;
  exportToCSV: (logs: AuditLog[]) => void;
  exportToJSON: (logs: AuditLog[]) => void;
  
  // Utils
  clearError: () => void;
}

export function useAudit(): UseAuditReturn {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditSummary>({
    total: 0,
    by_action: {} as Record<AuditAction, number>,
    by_entity: {} as Record<AuditEntityType, number>,
    by_user: {} as Record<string, number>,
    recent_actions: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = useCallback(async (filter: AuditFilter = {}, page: number = 1) => {
    setLoading(true);
    setError(null);
    
    console.log('🔍 useAudit.fetchLogs - Iniciando busca de logs...');
    console.log('🔍 useAudit.fetchLogs - Filtros:', filter);
    console.log('🔍 useAudit.fetchLogs - Página:', page);
    
    try {
      const result = await auditService.getAuditLogsPaginated(page, 20, filter);
      console.log('🔍 useAudit.fetchLogs - Resultado:', result);
      setLogs(result.data);
      setCurrentPage(page);
      setTotalPages(result.totalPages);
      setTotalLogs(result.total);
    } catch (err) {
      setError('Erro ao buscar logs de auditoria');
      console.error('❌ useAudit.fetchLogs - Erro ao buscar logs de auditoria:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (filter: AuditFilter = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const summaryData = await auditService.getAuditSummary(filter);
      setSummary(summaryData);
    } catch (err) {
      setError('Erro ao gerar resumo de auditoria');
      console.error('Erro ao gerar resumo de auditoria:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportToCSV = useCallback((logsToExport: AuditLog[]) => {
    try {
      const csvContent = auditService.exportToCSV(logsToExport);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Erro ao exportar para CSV');
      console.error('Erro ao exportar para CSV:', err);
    }
  }, []);

  const exportToJSON = useCallback((logsToExport: AuditLog[]) => {
    try {
      const jsonContent = auditService.exportToJSON(logsToExport);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Erro ao exportar para JSON');
      console.error('Erro ao exportar para JSON:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Carregar logs iniciais quando o hook é montado
  useEffect(() => {
    fetchLogs();
    fetchSummary();
  }, [fetchLogs, fetchSummary]);

  return {
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
  };
}

// Hook para registrar ações de auditoria
export function useAuditLog() {
  const logAction = useCallback(async (
    action: AuditAction,
    entity_type: AuditEntityType,
    entity_id: string,
    entity_name: string,
    details: any = {}
  ) => {
    try {
      await auditService.logAction(action, entity_type, entity_id, entity_name, details);
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error);
    }
  }, []);

  return { logAction };
}