// Tipos para o sistema de auditoria

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER_ENTRADA = 'REGISTER_ENTRADA',
  REGISTER_SAIDA = 'REGISTER_SAIDA',
  REGISTER_SAIDA_LOTE = 'REGISTER_SAIDA_LOTE',
  REGISTER_SAIDA_HISTORICO = 'REGISTER_SAIDA_HISTORICO',
  CADASTRAR_PESSOA = 'CADASTRAR_PESSOA',
  EDITAR_PESSOA = 'EDITAR_PESSOA',
  EXCLUIR_PESSOA = 'EXCLUIR_PESSOA',
  CADASTRAR_USUARIO = 'CADASTRAR_USUARIO',
  EDITAR_USUARIO = 'EDITAR_USUARIO',
  EXCLUIR_USUARIO = 'EXCLUIR_USUARIO',
  ALTERAR_SENHA = 'ALTERAR_SENHA',
  GERAR_RELATORIO = 'GERAR_RELATORIO'
}

export enum AuditEntityType {
  PESSOA = 'PESSOA',
  MOVIMENTACAO = 'MOVIMENTACAO',
  USUARIO = 'USUARIO',
  EMPRESA = 'EMPRESA',
  RELATORIO = 'RELATORIO'
}

export interface AuditLog {
  id: string;
  empresa_id: string;
  user_id: string;
  user_name: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  entity_name: string;
  details: AuditDetails;
  created_at: string;
}

export interface AuditDetails {
  before?: Record<string, any>;
  after?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditFilter {
  startDate?: string;
  endDate?: string;
  action?: AuditAction;
  entity_type?: AuditEntityType;
  user_id?: string;
  search?: string;
}

export interface AuditSummary {
  total: number;
  by_action: Record<AuditAction, number>;
  by_entity: Record<AuditEntityType, number>;
  by_user: Record<string, number>;
  recent_actions: AuditLog[];
}