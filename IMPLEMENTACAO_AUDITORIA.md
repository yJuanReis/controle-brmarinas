# Implementação de Auditoria - Sistema de Controle de Acesso Marina

## Visão Geral

Esta implementação adiciona um sistema de auditoria completo ao projeto de controle de acesso de marinas, permitindo o rastreamento de todas as ações importantes realizadas no sistema.

## Estrutura Implementada

### 1. Tipos e Interfaces (`src/types/audit.ts`)

```typescript
export enum AuditAction {
  CADASTRAR_PESSOA = 'CADASTRAR_PESSOA',
  UPDATE = 'UPDATE',
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA'
}

export enum AuditEntityType {
  PESSOA = 'PESSOA',
  MOVIMENTACAO = 'MOVIMENTACAO'
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  entity_name: string;
  user_id: string;
  user_name: string;
  before_data: Record<string, any> | null;
  after_data: Record<string, any> | null;
  created_at: string;
}

export interface AuditFilter {
  limit?: number;
  offset?: number;
  action?: AuditAction;
  entityType?: AuditEntityType;
  startDate?: string;
  endDate?: string;
}
```

### 2. Serviço de Auditoria (`src/services/auditService.ts`)

Implementa todas as operações de auditoria:

- **logAction**: Registra ações no banco de dados
- **getLogs**: Recupera logs com filtros avançados
- **getActionsByEntity**: Obtém histórico de ações por entidade
- **getRecentActivity**: Recupera atividades recentes

### 3. Hook React (`src/hooks/useAudit.ts`)

Hook personalizado para uso em componentes React:

```typescript
const { 
  logAction, 
  getLogs, 
  getActionsByEntity, 
  getRecentActivity 
} = useAudit();
```

### 4. Página de Logs de Auditoria (`src/pages/AuditLogsPage.tsx`)

Interface administrativa completa para visualização e filtragem de logs:

- Tabela paginada com todos os logs
- Filtros por ação, entidade, data e usuário
- Exportação de dados
- Integração com React Query para cache

### 5. Exemplo de Uso (`src/examples/AuditExample.tsx`)

Componente demonstrativo mostrando como integrar a auditoria em outros componentes.

### 6. Testes (`src/services/__tests__/auditService.test.ts`)

Testes unitários completos cobrindo:

- Registro de ações
- Recuperação de logs
- Filtros avançados
- Tratamento de erros

## Integração com o Sistema

### Contexto da Marina (`src/contexts/MarinaContext.tsx`)

A auditoria foi integrada às principais ações do sistema:

1. **Cadastro de Pessoa**: Registra criação de novas pessoas
2. **Atualização de Pessoa**: Registra alterações com dados antes/depois
3. **Registro de Entrada**: Registra movimentações de entrada
4. **Registro de Saída**: Registra movimentações de saída

### Exemplo de Integração

```typescript
// No cadastrarPessoa
await auditService.logAction(
  AuditAction.CADASTRAR_PESSOA,
  AuditEntityType.PESSOA,
  novaPessoa.id,
  novaPessoa.nome,
  {
    before: null,
    after: {
      nome: novaPessoa.nome,
      documento: novaPessoa.documento,
      tipo: novaPessoa.tipo,
      contato: novaPessoa.contato,
      placa: novaPessoa.placa,
      empresa_id: novaPessoa.empresa_id
    }
  }
);
```

## Banco de Dados

### Tabela `audit_logs`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### RLS (Row Level Security)

```sql
-- Apenas owners podem ver logs
CREATE POLICY "Owners can view audit logs" ON audit_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
    AND up.role = 'owner'
  )
);
```

## Funcionalidades Principais

### 1. Rastreamento Completo
- Todas as ações críticas são registradas
- Dados antes e depois das alterações
- Identificação do usuário responsável

### 2. Filtros Avançados
- Por tipo de ação
- Por tipo de entidade
- Por intervalo de datas
- Por usuário

### 3. Interface Administrativa
- Tabela paginada
- Filtros em tempo real
- Exportação de dados
- Visualização detalhada

### 4. Performance
- Uso de React Query para cache
- Paginação eficiente
- Filtros otimizados

## Benefícios

1. **Conformidade**: Atende requisitos de auditoria e compliance
2. **Segurança**: Rastreamento de todas as alterações críticas
3. **Debug**: Facilita a identificação de problemas
4. **Responsabilidade**: Identificação clara de quem fez o quê
5. **Histórico**: Manutenção completa do histórico de alterações

## Como Testar

1. Acesse a página de logs de auditoria no admin panel
2. Realize operações no sistema (cadastrar pessoa, registrar entrada/saída)
3. Verifique os logs gerados na tabela
4. Teste os filtros e funcionalidades de exportação

## Próximos Passos

- [ ] Integração com notificações
- [ ] Relatórios avançados
- [ ] Alertas de auditoria
- [ ] Integração com sistemas externos
- [ ] Dashboard de métricas de auditoria

## Observações

- O sistema de auditoria é opcional e não afeta o funcionamento principal
- Os logs são armazenados separadamente para melhor performance
- A implementação segue os padrões de segurança do Supabase
- Totalmente integrado com o sistema de autenticação existente