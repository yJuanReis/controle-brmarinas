-- get_movimentacoes_por_empresa.sql
-- Função RPC para buscar movimentações com paginação, contornando limite de 1000 registros

CREATE OR REPLACE FUNCTION get_movimentacoes_por_empresa(
  p_empresa_id TEXT,
  p_limit INTEGER DEFAULT 1000,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  empresa_id TEXT,
  pessoa_id UUID,
  entrada_em TIMESTAMPTZ,
  saida_em TIMESTAMPTZ,
  status TEXT,
  observacao TEXT,
  excluido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.empresa_id,
    m.pessoa_id,
    m.entrada_em,
    m.saida_em,
    m.status,
    m.observacao,
    m.excluido_em,
    m.created_at
  FROM movimentacoes m
  WHERE m.empresa_id = p_empresa_id
    AND m.excluido_em IS NULL
  ORDER BY m.entrada_em DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
