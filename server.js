const express = require('express');
const cors = require('cors');
const items = require('./models/items');
const variants = require('./models/variants');
const db = require('./database/db'); // Better-SQLite3 connection

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// =====================
// Ensure Tables
// =====================
db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customerName TEXT,
    totalQuantity INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER,
    itemId INTEGER,
    quantity INTEGER,
    FOREIGN KEY (orderId) REFERENCES orders(id),
    FOREIGN KEY (itemId) REFERENCES items(id)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemNumber TEXT,
    name TEXT,
    inventory INTEGER,
    type TEXT,
    category TEXT,
    collection TEXT,
    style TEXT,
    special TEXT,
    imageURL TEXT
  )
`).run();

// =====================
// Orders Routes
// =====================

// Get all orders with items, createdAt formatted as ISO 8601 UTC
app.get('/api/orders', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT id, customerName, totalQuantity, notes,
             STRFTIME('%Y-%m-%dT%H:%M:%SZ', createdAt) AS createdAt
      FROM orders
    `).all();

    const getOrderItems = db.prepare(`
      SELECT oi.*, i.itemNumber, i.name 
      FROM order_items oi
      JOIN items i ON oi.itemId = i.id
      WHERE oi.orderId = ?
    `);

    const ordersWithItems = orders.map(order => {
      const items = getOrderItems.all(order.id);
      return { ...order, items };
    });

    res.json(ordersWithItems);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get one order by ID with createdAt as ISO 8601 UTC
app.get('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  try {
    const order = db.prepare(`
      SELECT id, customerName, totalQuantity, notes,
             STRFTIME('%Y-%m-%dT%H:%M:%SZ', createdAt) AS createdAt
      FROM orders WHERE id = ?
    `).get(orderId);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = db.prepare(`
      SELECT oi.quantity, i.*
      FROM order_items oi
      JOIN items i ON oi.itemId = i.id
      WHERE oi.orderId = ?
    `).all(orderId);

    order.items = items;
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// =====================
// Items Routes
// =====================
app.get('/api/items', (req, res) => {
  res.json(items.getAllItems());
});

app.get('/api/items/:id', (req, res) => {
  const item = items.getItemById(req.params.id);
  if (item) res.json(item);
  else res.status(404).json({ error: 'Item not found' });
});

app.post('/api/items', (req, res) => {
  try {
    const id = items.addItem(req.body);
    res.json({ id });
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(500).json({ error: 'Failed to save item' });
  }
});

app.put('/api/items/:id', (req, res) => {
  try {
    items.updateItem(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  items.deleteItem(req.params.id);
  res.json({ success: true });
});

// =====================
// Variants Routes
// =====================
app.get('/api/variants', (req, res) => {
  res.json(variants.getAllVariants());
});

app.get('/api/variants/:id', (req, res) => {
  const variant = variants.getVariantById(req.params.id);
  if (variant) res.json(variant);
  else res.status(404).json({ error: 'Variant not found' });
});

app.post('/api/variants', (req, res) => {
  const id = variants.addVariant(req.body);
  res.json({ id });
});

app.put('/api/variants/:id', (req, res) => {
  variants.updateVariant(req.params.id, req.body);
  res.json({ success: true });
});

app.delete('/api/variants/:id', (req, res) => {
  variants.deleteVariant(req.params.id);
  res.json({ success: true });
});

// =====================
// Create New Order
// =====================
app.post('/api/orders', (req, res) => {
  const { customerName, items: orderItems, notes } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ error: 'No items in order' });
  }

  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const insertOrder = db.prepare(`
  INSERT INTO orders (customerName, totalQuantity, notes)
  VALUES (?, ?, ?)
`);
const info = insertOrder.run(customerName || '', totalQuantity, notes || '');

  const orderId = info.lastInsertRowid;

  const findItemId = db.prepare(`SELECT id FROM items WHERE itemNumber = ?`);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (orderId, itemId, quantity)
    VALUES (?, ?, ?)
  `);
  const updateInventory = db.prepare(`
    UPDATE items SET inventory = inventory - ? WHERE id = ?
  `);

  try {
    const transaction = db.transaction(() => {
      for (const item of orderItems) {
        const found = findItemId.get(item.itemNumber);
        if (!found) {
          throw new Error(`Item not found: ${item.itemNumber}`);
        }
        insertOrderItem.run(orderId, found.id, item.quantity);
        updateInventory.run(item.quantity, found.id);
      }
    });

    transaction();

    res.json({ success: true, orderId });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// =====================
// Server Start
// =====================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
