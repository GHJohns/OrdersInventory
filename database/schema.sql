-- Items table
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_number TEXT UNIQUE,
  name TEXT,
  inventory INTEGER DEFAULT 0,
  type TEXT,
  category TEXT,
  collection TEXT,
  style TEXT,
  special TEXT
);

-- Variants table
CREATE TABLE IF NOT EXISTS variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE,
  item_id INTEGER,
  location TEXT,
  backstock_location TEXT,
  color1 TEXT,
  color2 TEXT,
  accent_color TEXT,
  frame_finish TEXT,
  lens_color TEXT,
  lens_finish TEXT,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  variant_id INTEGER,
  path TEXT,
  format TEXT,
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (variant_id) REFERENCES variants(id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  item_id INTEGER,
  variant_id INTEGER,
  quantity INTEGER DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (variant_id) REFERENCES variants(id)
);
