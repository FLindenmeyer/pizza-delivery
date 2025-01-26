/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumn('orders', {
    preparation_time: {
      type: 'timestamptz',
      notNull: false
    }
  });

  // Add index for better performance
  pgm.createIndex('orders', 'preparation_time');
};

exports.down = pgm => {
  pgm.dropIndex('orders', 'preparation_time');
  pgm.dropColumn('orders', 'preparation_time');
}; 