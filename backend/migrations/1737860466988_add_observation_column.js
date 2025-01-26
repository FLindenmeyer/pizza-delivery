/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumn('order_pizzas', {
    observation: { type: 'text', notNull: false }
  });
};

exports.down = pgm => {
  pgm.dropColumn('order_pizzas', 'observation');
}; 