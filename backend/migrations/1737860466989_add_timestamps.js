/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Adiciona as colunas de timestamp
  pgm.addColumns('orders', {
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });

  // Remove a coluna order_date se ela existir
  pgm.dropColumn('orders', 'order_date', { ifExists: true });

  // Cria a função de trigger para atualizar updated_at
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Cria o trigger
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
  // Remove o trigger
  pgm.dropTrigger('orders', 'update_orders_updated_at', { ifExists: true });
  
  // Remove a função
  pgm.sql('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;');
  
  // Remove as colunas
  pgm.dropColumns('orders', ['created_at', 'updated_at'], { ifExists: true });
  
  // Adiciona a coluna order_date de volta
  pgm.addColumn('orders', {
    order_date: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });
}; 