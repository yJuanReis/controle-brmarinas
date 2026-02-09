-- Migration: Add Performance Indexes
-- Purpose: Improve query performance for scalability (10k users, 100k records)
-- Date: 2024-02-09

-- ============================================
-- INDEXES FOR MOVIMENTACOES TABLE
-- ============================================

-- Main query pattern: WHERE empresa_id ORDER BY entrada_em DESC
-- This is used in get_movimentacoes_por_empresa and getHistoricoMovimentacoes
CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa_entrada
ON movimentacoes(empresa_id, entrada_em DESC)
WHERE excluido_em IS NULL;

-- For status queries (DENTRO/FORA filtering)
CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa_status
ON movimentacoes(empresa_id, status)
WHERE excluido_em IS NULL;

-- For date range queries with company filter
CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa_periodo
ON movimentacoes(empresa_id, entrada_em DESC)
WHERE excluido_em IS NULL;

-- Composite index for people inside queries
CREATE INDEX IF NOT EXISTS idx_movimentacoes_dentro
ON movimentacoes(empresa_id, status, entrada_em DESC)
WHERE excluido_em IS NULL AND status = 'DENTRO';

-- ============================================
-- INDEXES FOR PESSOAS TABLE
-- ============================================

-- Main query pattern: WHERE empresa_id (getPessoasPorEmpresa)
CREATE INDEX IF NOT EXISTS idx_pessoas_empresa
ON pessoas(empresa_id);

-- For document search (cpf/cnpj lookup)
CREATE INDEX IF NOT EXISTS idx_pessoas_documento
ON pessoas(documento);

-- Composite index for empresa + documento unique constraint
CREATE INDEX IF NOT EXISTS idx_pessoas_empresa_documento
ON pessoas(empresa_id, documento);

-- For placa search
CREATE INDEX IF NOT EXISTS idx_pessoas_placa
ON pessoas(placa)
WHERE placa IS NOT NULL;

-- ============================================
-- INDEXES FOR USER_PROFILES TABLE
-- ============================================

-- For user lookup by company
CREATE INDEX IF NOT EXISTS idx_user_profiles_empresa
ON user_profiles(empresa_id);

-- For role-based queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_empresa_role
ON user_profiles(empresa_id, role);

-- ============================================
-- INDEX FOR RELATORIOS (DATE RANGE + COMPANY)
-- ============================================

-- For date range queries used in RelatoriosModal
CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa_periodo_full
ON movimentacoes(empresa_id, entrada_em DESC)
WHERE excluido_em IS NULL;

-- ============================================
-- FUNCTION TO CHECK INDEXES EXIST
-- ============================================

-- This helps verify indexes were created successfully
CREATE OR REPLACE FUNCTION check_indexes_created()
RETURNS TABLE (index_name TEXT, status TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.relname AS index_name,
        'Created' AS status
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_namespace n ON n.oid = i.relnamespace
    WHERE t.relname = 'movimentacoes'
    AND i.relname LIKE 'idx_movimentacoes%'
    ORDER BY i.relname;
END;
$$;
