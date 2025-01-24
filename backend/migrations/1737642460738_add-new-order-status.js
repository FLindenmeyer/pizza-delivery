/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Primeiro, vamos alterar a coluna para texto temporariamente
  pgm.alterColumn('orders', 'status', {
    type: 'text',
    using: 'status::text'
  });

  // Remove o tipo enum antigo com CASCADE para remover dependências
  pgm.sql('DROP TYPE order_status CASCADE;');

  // Cria o novo tipo enum com todos os status
  pgm.createType('order_status', [
    'PENDING',
    'IN_PREPARATION',
    'ASSEMBLY',
    'ASSEMBLY_COMPLETED',
    'BAKING',
    'READY',
    'DELIVERED'
  ]);

  // Atualiza os registros existentes para usar os novos status
  pgm.sql(`
    UPDATE orders 
    SET status = CASE 
      WHEN status = 'PREPARING' THEN 'IN_PREPARATION'
      ELSE status 
    END;
  `);

  // Altera a coluna para usar o novo tipo enum
  pgm.alterColumn('orders', 'status', {
    type: 'order_status',
    using: 'status::order_status'
  });
};

exports.down = pgm => {
  // Primeiro, altera a coluna para texto temporariamente
  pgm.alterColumn('orders', 'status', {
    type: 'text',
    using: 'status::text'
  });

  // Remove o tipo enum atual com CASCADE para remover dependências
  pgm.sql('DROP TYPE order_status CASCADE;');

  // Cria o tipo enum antigo
  pgm.createType('order_status', [
    'PENDING',
    'PREPARING',
    'READY',
    'DELIVERED'
  ]);

  // Atualiza os registros para usar os status antigos
  pgm.sql(`
    UPDATE orders 
    SET status = CASE 
      WHEN status IN ('IN_PREPARATION', 'ASSEMBLY', 'ASSEMBLY_COMPLETED', 'BAKING') THEN 'PREPARING'
      ELSE status 
    END;
  `);

  // Altera a coluna para usar o tipo enum antigo
  pgm.alterColumn('orders', 'status', {
    type: 'order_status',
    using: 'status::order_status'
  });
};
