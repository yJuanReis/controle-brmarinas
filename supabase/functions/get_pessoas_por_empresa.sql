-- ============================================
-- PostgreSQL Function: get_pessoas_por_empresa
-- Objetivo: Retornar todas as pessoas de uma empresa com paginação
-- Suporta mais de 1000 registros
-- ============================================

-- Dropar função existente
DROP FUNCTION IF EXISTS get_pessoas_por_empresa(TEXT, INTEGER, INTEGER);

-- Criar a função com parâmetros de paginação
-- Nota: A tabela pessoas NÃO tem coluna excluido_em, por isso não filtramos por ela
CREATE OR REPLACE FUNCTION get_pessoas_por_empresa(
  p_empresa_id TEXT,
  p_limit INTEGER DEFAULT 1000,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF pessoas
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM pessoas
  WHERE empresa_id = p_empresa_id
  ORDER BY nome ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ============================================
-- Exemplos de uso:
-- ============================================
--
-- Padrão (retorna até 1000):
-- SELECT * FROM get_pessoas_por_empresa('gloria');
--
-- Com paginação:
-- SELECT * FROM get_pessoas_por_empresa('gloria', 1000, 0);  -- primeiros 1000
-- SELECT * FROM get_pessoas_por_empresa('gloria', 1000, 1000); -- próximos 1000
--
