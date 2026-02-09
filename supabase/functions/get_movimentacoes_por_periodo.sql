-- ============================================
-- PostgreSQL Function: get_movimentacoes_por_periodo
-- Objetivo: Retornar movimentações de uma empresa em um período específico
-- Suporta paginação para superar limite de 1000 registros
-- ============================================

-- Primeiro, dropar todas as versões da função para evitar conflitos
DROP FUNCTION IF EXISTS get_movimentacoes_por_periodo(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_movimentacoes_por_periodo(TEXT, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_movimentacoes_por_periodo(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER);

-- Criar a função com parâmetros de paginação
CREATE OR REPLACE FUNCTION get_movimentacoes_por_periodo(
  p_empresa_id TEXT,
  p_data_inicio TIMESTAMP WITH TIME ZONE,
  p_data_fim TIMESTAMP WITH TIME ZONE,
  p_limit INTEGER DEFAULT 1000,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF movimentacoes
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM movimentacoes
  WHERE empresa_id = p_empresa_id
    AND entrada_em >= p_data_inicio
    AND entrada_em <= p_data_fim
    AND excluido_em IS NULL
  ORDER BY entrada_em ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ============================================
-- Como executar no Supabase Dashboard:
-- ============================================
--
-- 1. Abra o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole o código acima
-- 4. Clique em "Run"
--
-- ============================================
-- Exemplos de uso:
-- ============================================
--
-- Padrão (retorna até 1000 registros):
-- SELECT * FROM get_movimentacoes_por_periodo(
--   'gloria',
--   '2024-01-01 00:00:00',
--   '2024-12-31 23:59:59'
-- );
--
-- Com paginação (registros 0-1000):
-- SELECT * FROM get_movimentacoes_por_periodo(
--   'gloria',
--   '2024-01-01 00:00:00',
--   '2024-12-31 23:59:59',
--   1000,  -- limit
--   0      -- offset
-- );
--
-- Segunda página (registros 1000-2000):
-- SELECT * FROM get_movimentacoes_por_periodo(
--   'gloria',
--   '2024-01-01 00:00:00',
--   '2024-12-31 23:59:59',
--   1000,
--   1000
-- );
--
