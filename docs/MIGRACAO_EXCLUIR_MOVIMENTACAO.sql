-- Migration: Adicionar campo excluido_em para soft delete de movimentações
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Adicionar coluna excluido_em na tabela movimentacoes (se não existir)
ALTER TABLE movimentacoes ADD COLUMN IF NOT EXISTS excluido_em timestamp with time zone;

-- 2. Criar índice para melhorar performance em consultas de exclusão
CREATE INDEX IF NOT EXISTS idx_movimentacoes_excluido_em ON movimentacoes(excluido_em);

-- 3. Opcional: Criar policy para permitir que usuários vejam movimentações excluídas (se necessário)
-- Por padrão, as movimentações excluídas não aparecerão nas consultas normais
-- O sistema filtrará automaticamente pelo campo excluido_em = null

-- 4. Para verificar se a coluna foi adicionada corretamente:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'movimentacoes' 
AND column_name = 'excluido_em';
