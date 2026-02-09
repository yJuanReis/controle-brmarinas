-- ============================================
-- Migration: Adicionar parâmetro incluir_excluidas
-- Data: 2024-02-09
-- ============================================

-- Primeiro, dropar todas as versões da função para evitar conflitos
DROP FUNCTION IF EXISTS get_movimentacoes_por_periodo(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS get_movimentacoes_por_periodo(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_movimentacoes_por_periodo(TEXT, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_movimentacoes_por_periodo(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER);

-- Criar a função com parâmetros de paginação e opção para incluir excluídas
CREATE OR REPLACE FUNCTION get_movimentacoes_por_periodo(
  p_empresa_id TEXT,
  p_data_inicio TIMESTAMP WITH TIME ZONE,
  p_data_fim TIMESTAMP WITH TIME ZONE,
  p_limit INTEGER DEFAULT 1000,
  p_offset INTEGER DEFAULT 0,
  p_incluir_excluidas BOOLEAN DEFAULT false
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
    AND (excluido_em IS NULL OR p_incluir_excluidas = true)
  ORDER BY entrada_em ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Verificar se a função foi criada
SELECT proname FROM pg_proc WHERE proname = 'get_movimentacoes_por_periodo';
