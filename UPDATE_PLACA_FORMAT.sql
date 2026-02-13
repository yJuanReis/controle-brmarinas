-- Migration para formatar placas: ABC1234 → ABC-1234 (mantém ABC-1234)

-- Atualiza placas que NÃO têm hífen (7 caracteres = formato antigo sem hífen)
UPDATE pessoas
SET placa = UPPER(SUBSTRING(placa, 1, 3) || '-' || SUBSTRING(placa, 4))
WHERE placa IS NOT NULL
  AND placa != ''
  AND LENGTH(placa) = 7
  AND placa NOT LIKE '%-%';

-- Verificar o resultado (opcional)
-- SELECT placa, LENGTH(placa) as len, placa LIKE '%-%' as tem_hifen FROM pessoas WHERE placa IS NOT NULL AND placa != '';
