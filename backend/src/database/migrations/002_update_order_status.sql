-- Primeiro, criamos um novo tipo enum com os valores atualizados
CREATE TYPE order_status_new AS ENUM (
  'PENDING',
  'ASSEMBLY',
  'ASSEMBLY_COMPLETED',
  'BAKING',
  'READY',
  'DELIVERED'
);

-- Atualizamos a coluna status para usar o novo enum
ALTER TABLE orders 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE order_status_new 
    USING (
      CASE status::text
        WHEN 'PENDING' THEN 'PENDING'
        WHEN 'PREPARING' THEN 'ASSEMBLY'
        WHEN 'READY' THEN 'READY'
        WHEN 'DELIVERED' THEN 'DELIVERED'
      END
    )::order_status_new;

-- Removemos o enum antigo
DROP TYPE order_status;

-- Renomeamos o novo enum para o nome original
ALTER TYPE order_status_new RENAME TO order_status;

-- Restauramos o valor default
ALTER TABLE orders 
  ALTER COLUMN status SET DEFAULT 'PENDING'; 