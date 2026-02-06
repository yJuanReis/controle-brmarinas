-- Query para corrigir observações vazias no Supabase SQL Editor
-- Execute esta query para atualizar registros que estão com observacao = null

-- Atualizar registros com observacao = null para saída manual
UPDATE movimentacoes
SET observacao = 'Saída finalizada'
WHERE status = 'FORA'
  AND saida_em IS NOT NULL
  AND (observacao IS NULL OR observacao = '');

-- Verificar o resultado
SELECT 
  id,
  empresa_id,
  pessoa_id,
  entrada_em,
  saida_em,
  status,
  observacao
FROM movimentacoes
WHERE status = 'FORA'
  AND saida_em IS NOT NULL
ORDER BY entrada_em DESC
LIMIT 20;
