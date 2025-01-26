-- Configura o timezone do banco para UTC
SET timezone = 'UTC';

-- Remove a coluna order_date
ALTER TABLE orders DROP COLUMN order_date;

-- Atualiza os timestamps existentes para o fuso horário correto
UPDATE orders 
SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo',
    updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo';

-- Altera as colunas para usar timestamptz (timestamp with time zone)
ALTER TABLE orders 
  ALTER COLUMN created_at TYPE timestamptz,
  ALTER COLUMN updated_at TYPE timestamptz; 