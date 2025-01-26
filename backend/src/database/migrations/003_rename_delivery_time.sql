-- Renomeia a coluna delivery_time para preparation_time
ALTER TABLE orders RENAME COLUMN delivery_time TO preparation_time;

-- Remove o índice antigo
DROP INDEX IF EXISTS idx_orders_delivery_time;

-- Cria o novo índice
CREATE INDEX idx_orders_preparation_time ON orders(preparation_time); 