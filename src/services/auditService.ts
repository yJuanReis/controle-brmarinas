import { supabase } from '@/lib/supabase';
import { 
  AuditLog, 
  AuditAction, 
  AuditEntityType, 
  AuditDetails, 
  AuditFilter, 
  AuditSummary 
} from '@/types/audit';
import { useAuth } from '@/hooks/useAuth';

export class AuditService {
  private static instance: AuditService;
  private auth: ReturnType<typeof useAuth>;

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Registra uma ação de auditoria
   */
  public async logAction(
    action: AuditAction,
    entity_type: AuditEntityType,
    entity_id: string,
    entity_name: string,
    details: AuditDetails = {}
  ): Promise<void> {
    try {
      console.log('🔍 AuditService.logAction - Iniciando registro de auditoria...');
      
      const { user, error: authError } = await supabase.auth.getUser();
      console.log('👤 Usuário obtido:', user);
      console.log('❌ Erro de auth:', authError);
      
      const empresaId = localStorage.getItem('empresa_id');
      console.log('🏢 Empresa ID:', empresaId);

      if (!user || !empresaId) {
        console.warn('⚠️ Não é possível registrar auditoria: usuário não autenticado ou empresa não definida');
        console.log('👤 User:', !!user);
        console.log('🏢 Empresa ID:', !!empresaId);
        return;
      }

      // Obter informações do navegador
      const userAgent = navigator.userAgent;
      const ipAddress = await this.getIPAddress();

      const auditLog: Omit<AuditLog, 'id' | 'created_at'> = {
        empresa_id: empresaId,
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email || 'Usuário Desconhecido',
        action,
        entity_type,
        entity_id,
        entity_name,
        details: {
          ...details,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        }
      };

      console.log('📝 Dados do log a ser inserido:', auditLog);

      const { error } = await supabase
        .from('audit_logs')
        .insert([auditLog]);

      if (error) {
        console.error('❌ Erro ao registrar auditoria:', error);
      } else {
        console.log('✅ Auditoria registrada com sucesso!');
      }
    } catch (error) {
      console.error('❌ Erro ao registrar auditoria:', error);
    }
  }

  /**
   * Obtém o endereço IP do cliente (usando serviço externo)
   */
  private async getIPAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'Desconhecido';
    }
  }

  /**
   * Busca logs de auditoria com filtros
   */
  public async getAuditLogs(filter: AuditFilter = {}): Promise<AuditLog[]> {
    try {
      // Verificar se a tabela existe
      const { data: tableCheck, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'audit_logs');

      if (tableError || !tableCheck || tableCheck.length === 0) {
        console.warn('Tabela audit_logs não encontrada, retornando array vazio');
        return [];
      }

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filter.startDate) {
        query = query.gte('created_at', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('created_at', filter.endDate);
      }

      if (filter.action) {
        query = query.eq('action', filter.action);
      }

      if (filter.entity_type) {
        query = query.eq('entity_type', filter.entity_type);
      }

      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }

      if (filter.search) {
        const search = `%${filter.search.toLowerCase()}%`;
        query = query.or(
          `user_name.ilike.${search},entity_name.ilike.${search},details->>metadata.ilike.${search}`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      return [];
    }
  }

  /**
   * Busca logs de auditoria por página (para paginação)
   */
  public async getAuditLogsPaginated(
    page: number = 1,
    pageSize: number = 20,
    filter: AuditFilter = {}
  ): Promise<{ data: AuditLog[]; total: number; totalPages: number }> {
    try {
      // Verificar se a tabela existe
      const { data: tableCheck, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'audit_logs');

      if (tableError || !tableCheck || tableCheck.length === 0) {
        console.warn('Tabela audit_logs não encontrada, retornando resultados vazios');
        return { data: [], total: 0, totalPages: 0 };
      }

      const offset = (page - 1) * pageSize;

      // Primeiro, contar o total
      let countQuery = supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      if (filter.startDate) {
        countQuery = countQuery.gte('created_at', filter.startDate);
      }

      if (filter.endDate) {
        countQuery = countQuery.lte('created_at', filter.endDate);
      }

      if (filter.action) {
        countQuery = countQuery.eq('action', filter.action);
      }

      if (filter.entity_type) {
        countQuery = countQuery.eq('entity_type', filter.entity_type);
      }

      if (filter.user_id) {
        countQuery = countQuery.eq('user_id', filter.user_id);
      }

      if (filter.search) {
        const search = `%${filter.search.toLowerCase()}%`;
        countQuery = countQuery.or(
          `user_name.ilike.${search},entity_name.ilike.${search},details->>metadata.ilike.${search}`
        );
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('Erro ao contar logs de auditoria:', countError);
        return { data: [], total: 0, totalPages: 0 };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      // Buscar os dados da página
      let dataQuery = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (filter.startDate) {
        dataQuery = dataQuery.gte('created_at', filter.startDate);
      }

      if (filter.endDate) {
        dataQuery = dataQuery.lte('created_at', filter.endDate);
      }

      if (filter.action) {
        dataQuery = dataQuery.eq('action', filter.action);
      }

      if (filter.entity_type) {
        dataQuery = dataQuery.eq('entity_type', filter.entity_type);
      }

      if (filter.user_id) {
        dataQuery = dataQuery.eq('user_id', filter.user_id);
      }

      if (filter.search) {
        const search = `%${filter.search.toLowerCase()}%`;
        dataQuery = dataQuery.or(
          `user_name.ilike.${search},entity_name.ilike.${search},details->>metadata.ilike.${search}`
        );
      }

      const { data, error } = await dataQuery;

      if (error) {
        console.error('Erro ao buscar logs de auditoria paginados:', error);
        return { data: [], total: 0, totalPages: 0 };
      }

      return {
        data: data || [],
        total,
        totalPages
      };
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria paginados:', error);
      return { data: [], total: 0, totalPages: 0 };
    }
  }

  /**
   * Gera um resumo das auditorias
   */
  public async getAuditSummary(filter: AuditFilter = {}): Promise<AuditSummary> {
    try {
      const logs = await this.getAuditLogs(filter);

      const summary: AuditSummary = {
        total: logs.length,
        by_action: {} as Record<AuditAction, number>,
        by_entity: {} as Record<AuditEntityType, number>,
        by_user: {} as Record<string, number>,
        recent_actions: logs.slice(0, 10)
      };

      // Contar por ação
      logs.forEach(log => {
        summary.by_action[log.action] = (summary.by_action[log.action] || 0) + 1;
        summary.by_entity[log.entity_type] = (summary.by_entity[log.entity_type] || 0) + 1;
        summary.by_user[log.user_name] = (summary.by_user[log.user_name] || 0) + 1;
      });

      return summary;
    } catch (error) {
      console.error('Erro ao gerar resumo de auditoria:', error);
      return {
        total: 0,
        by_action: {} as Record<AuditAction, number>,
        by_entity: {} as Record<AuditEntityType, number>,
        by_user: {} as Record<string, number>,
        recent_actions: []
      };
    }
  }

  /**
   * Exporta logs de auditoria para CSV
   */
  public exportToCSV(logs: AuditLog[]): string {
    const headers = [
      'Data/Hora',
      'Usuário',
      'Ação',
      'Entidade',
      'ID da Entidade',
      'Nome da Entidade',
      'Detalhes'
    ];

    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString('pt-BR'),
      log.user_name,
      log.action,
      log.entity_type,
      log.entity_id,
      log.entity_name,
      JSON.stringify(log.details)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Exporta logs de auditoria para JSON
   */
  public exportToJSON(logs: AuditLog[]): string {
    return JSON.stringify(logs, null, 2);
  }
}

// Exportar instância única
export const auditService = AuditService.getInstance();