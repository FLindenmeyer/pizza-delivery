/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Verifica se o tipo order_status já existe
  pgm.sql(`DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
      CREATE TYPE order_status AS ENUM (
        'PENDING',
        'IN_PREPARATION',
        'ASSEMBLY',
        'ASSEMBLY_COMPLETED',
        'BAKING',
        'READY',
        'DELIVERED'
      );
    END IF;
  END$$;`);

  // Cria a tabela orders se não existir
  pgm.sql(`CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    house_number VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    status order_status NOT NULL DEFAULT 'PENDING',
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivery_time TIME NOT NULL,
    is_scheduled BOOLEAN NOT NULL DEFAULT FALSE,
    total_price DECIMAL(10,2) NOT NULL
  )`);

  // Cria a tabela order_pizzas se não existir
  pgm.sql(`CREATE TABLE IF NOT EXISTS order_pizzas (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    flavors JSONB NOT NULL,
    size VARCHAR(20) NOT NULL,
    slices INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1
  )`);

  // Cria os índices se não existirem
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'orders_order_date_idx') THEN
        CREATE INDEX orders_order_date_idx ON orders(order_date);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'orders_status_idx') THEN
        CREATE INDEX orders_status_idx ON orders(status);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'order_pizzas_order_id_idx') THEN
        CREATE INDEX order_pizzas_order_id_idx ON order_pizzas(order_id);
      END IF;
    END$$;
  `);
};

exports.down = pgm => {
  // Remove os índices
  pgm.sql(`
    DROP INDEX IF EXISTS order_pizzas_order_id_idx;
    DROP INDEX IF EXISTS orders_status_idx;
    DROP INDEX IF EXISTS orders_order_date_idx;
  `);
  
  // Remove as tabelas
  pgm.sql(`
    DROP TABLE IF EXISTS order_pizzas;
    DROP TABLE IF EXISTS orders;
  `);

  // Remove o tipo enum
  pgm.sql(`DROP TYPE IF EXISTS order_status CASCADE;`);
}; 