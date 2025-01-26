/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Create enum types
  pgm.createType('order_status', [
    'PENDING',
    'IN_PREPARATION',
    'ASSEMBLY',
    'ASSEMBLY_COMPLETED',
    'BAKING',
    'READY',
    'DELIVERED'
  ]);

  // Create orders table
  pgm.createTable('orders', {
    id: 'id',
    customer_name: { type: 'varchar(255)', notNull: true },
    house_number: { type: 'varchar(50)', notNull: true },
    phone: { type: 'varchar(20)' },
    status: { type: 'order_status', notNull: true, default: 'PENDING' },
    preparation_time: { type: 'timestamptz' },
    is_scheduled: { type: 'boolean', notNull: true, default: false },
    total_price: { type: 'decimal', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Create order_pizzas table
  pgm.createTable('order_pizzas', {
    id: 'id',
    order_id: {
      type: 'integer',
      notNull: true,
      references: '"orders"',
      onDelete: 'CASCADE'
    },
    flavors: { type: 'jsonb', notNull: true },
    size: { type: 'integer', notNull: true },
    slices: { type: 'integer', notNull: true },
    quantity: { type: 'integer', notNull: true },
    observation: { type: 'text' }
  });

  // Create indexes
  pgm.createIndex('orders', 'preparation_time');
  pgm.createIndex('orders', 'created_at');
  pgm.createIndex('orders', 'status');
  pgm.createIndex('order_pizzas', 'order_id');

  // Create updated_at trigger function
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger
  pgm.createTrigger(
    'orders',
    'update_orders_updated_at',
    {
      when: 'BEFORE',
      operation: 'UPDATE',
      level: 'ROW',
      function: 'update_updated_at_column'
    }
  );
};

exports.down = pgm => {
  // Drop trigger
  pgm.dropTrigger('orders', 'update_orders_updated_at', { ifExists: true });
  
  // Drop function
  pgm.dropFunction('update_updated_at_column', [], { ifExists: true });
  
  // Drop tables
  pgm.dropTable('order_pizzas', { cascade: true });
  pgm.dropTable('orders', { cascade: true });
  
  // Drop enum types
  pgm.dropType('order_status', { cascade: true });
}; 