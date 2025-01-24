CREATE TYPE order_status AS ENUM ('PENDING', 'PREPARING', 'READY', 'DELIVERED');
CREATE TYPE portion_type AS ENUM ('whole', 'half');

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  house_number VARCHAR(20) NOT NULL,
  phone VARCHAR(20),
  status order_status DEFAULT 'PENDING',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivery_time TIME NOT NULL,
  is_scheduled BOOLEAN DEFAULT FALSE,
  total_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE pizzas (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  size INTEGER DEFAULT 35,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pizza_flavors (
  id SERIAL PRIMARY KEY,
  pizza_id INTEGER REFERENCES pizzas(id),
  flavor_name VARCHAR(50) NOT NULL,
  portion portion_type NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_pizzas (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  flavors JSONB NOT NULL,
  size INTEGER NOT NULL,
  slices INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_delivery_time ON orders(delivery_time); 