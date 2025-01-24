/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Criar tipos ENUM se não existirem
  pgm.sql(`DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
      CREATE TYPE order_status AS ENUM ('PENDING', 'PREPARING', 'READY', 'DELIVERED');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'portion_type') THEN
      CREATE TYPE portion_type AS ENUM ('whole', 'half');
    END IF;
  END$$;`);

  // Criar tabela orders se não existir
  pgm.createTable('orders', {
    id: 'id',
    customer_name: { type: 'varchar(100)', notNull: true },
    house_number: { type: 'varchar(200)', notNull: true },
    phone: { type: 'varchar(20)' },
    status: { type: 'order_status', notNull: true, default: 'PENDING' },
    order_date: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    delivery_time: { type: 'time', notNull: true },
    is_scheduled: { type: 'boolean', notNull: true, default: false },
    total_price: { type: 'decimal(10,2)', notNull: true }
  });

  // Criar tabela order_pizzas se não existir
  pgm.createTable('order_pizzas', {
    id: 'id',
    order_id: {
      type: 'integer',
      notNull: true,
      references: '"orders"',
      onDelete: 'CASCADE'
    },
    flavors: { type: 'jsonb', notNull: true },
    size: { type: 'integer', notNull: true, default: 35 },
    slices: { type: 'integer', notNull: true, default: 8 },
    quantity: { type: 'integer', notNull: true }
  });

  // Criar índices
  pgm.createIndex('orders', 'order_date');
  pgm.createIndex('orders', 'delivery_time');
};

exports.down = pgm => {
  pgm.dropIndex('orders', 'delivery_time');
  pgm.dropIndex('orders', 'order_date');
  pgm.dropTable('order_pizzas');
  pgm.dropTable('orders');
  
  // Drop types if they exist
  pgm.sql(`DO $$
  BEGIN
    DROP TYPE IF EXISTS portion_type;
    DROP TYPE IF EXISTS order_status;
  END$$;`);
}; 