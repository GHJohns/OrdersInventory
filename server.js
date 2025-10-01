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

// Update an existing order
// server.js (add this PUT handler where your other /api/orders routes live)
app.put('/api/orders/:id', async (req, res) => {
  const orderId = Number(req.params.id);
  const { customerName, notes, items, touchTimestamp } = req.body || {};

  if (!orderId || !customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid payload: require customerName and non-empty items[]' });
  }

  try {
    const existing = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update header (optionally bump createdAt so it sorts to top on edit)
    if (touchTimestamp) {
      await db.run(
        "UPDATE orders SET customerName = ?, notes = ?, createdAt = datetime('now') WHERE id = ?",
        [customerName, notes || '', orderId]
      );
    } else {
      await db.run(
        "UPDATE orders SET customerName = ?, notes = ? WHERE id = ?",
        [customerName, notes || '', orderId]
      );
    }

    // Replace items (simple + predictable)
    await db.run('DELETE FROM order_items WHERE orderId = ?', [orderId]);
    for (const it of items) {
      const itemNumber = (it.itemNumber || '').trim();
      const quantity = Number(it.quantity) || 0;
      if (!itemNumber || quantity <= 0) continue;
      await db.run(
        'INSERT INTO order_items (orderId, itemNumber, quantity) VALUES (?, ?, ?)',
        [orderId, itemNumber, quantity]
      );
    }

    // Return updated order (header + items) so client can rely on the response
    const updated = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    const updatedItems = await db.all(
      `SELECT oi.itemNumber, oi.quantity,
              i.name, i.category, i.collection
         FROM order_items oi
         LEFT JOIN items i ON i.itemNumber = oi.itemNumber
        WHERE oi.orderId = ?
        ORDER BY oi.rowid ASC`,
      [orderId]
    );

    return res.status(200).json({ ...updated, items: updatedItems });
  } catch (err) {
    console.error('PUT /api/orders/:id failed:', err);
    return res.status(500).json({ error: 'Failed to update order' });
  }
});




// Get all orders with items, createdAt formatted as ISO 8601 UTC



// server.js
// GET all orders with embedded items (client will sort/limit to 20)
app.get('/api/orders', (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders').all();

    const itemsStmt = db.prepare(`
      SELECT oi.itemNumber, oi.quantity,
             i.name, i.category, i.collection
      FROM order_items oi
      LEFT JOIN items i ON i.itemNumber = oi.itemNumber
      WHERE oi.orderId = ?
      ORDER BY oi.rowid ASC
    `);

    const result = orders.map(o => ({
      ...o,
      items: itemsStmt.all(o.id)
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /api/orders failed:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});



// Get one order by ID with createdAt as ISO 8601 UTC
// server.js
// GET single order with embedded items
app.get('/api/orders/:id', (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = db.prepare(`
      SELECT oi.itemNumber, oi.quantity,
             i.name, i.category, i.collection
      FROM order_items oi
      LEFT JOIN items i ON i.itemNumber = oi.itemNumber
      WHERE oi.orderId = ?
      ORDER BY oi.rowid ASC
    `).all(orderId);

    res.json({ ...order, items });
  } catch (err) {
    console.error('GET /api/orders/:id failed:', err);
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

// PUT update order in-place (keep same ID). If `touchTimestamp: true`, bump createdAt.
app.put('/api/orders/:id', (req, res) => {
  const orderId = Number(req.params.id);
  const { customerName, notes, items, touchTimestamp } = req.body || {};

  if (!orderId || !customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid payload: require customerName and non-empty items[]' });
  }

  try {
    const exists = db.prepare('SELECT id FROM orders WHERE id = ?').get(orderId);
    if (!exists) return res.status(404).json({ error: 'Order not found' });

    const updateHeader =
      touchTimestamp
        ? db.prepare("UPDATE orders SET customerName = ?, notes = ?, createdAt = datetime('now') WHERE id = ?")
        : db.prepare("UPDATE orders SET customerName = ?, notes = ? WHERE id = ?");

    const deleteItems = db.prepare("DELETE FROM order_items WHERE orderId = ?");
    const insertItem  = db.prepare("INSERT INTO order_items (orderId, itemNumber, quantity) VALUES (?, ?, ?)");

    const saveTx = db.transaction(() => {
      updateHeader.run(customerName, notes || '', orderId);
      deleteItems.run(orderId);
      for (const it of items) {
        const itemNumber = (it.itemNumber || '').trim();
        const quantity = Number(it.quantity) || 0;
        if (!itemNumber || quantity <= 0) continue;
        insertItem.run(orderId, itemNumber, quantity);
      }
    });

    saveTx(); // run the transaction

    // Return updated order with items so the client can rely on it
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const updatedItems = db.prepare(`
      SELECT oi.itemNumber, oi.quantity,
             i.name, i.category, i.collection
      FROM order_items oi
      LEFT JOIN items i ON i.itemNumber = oi.itemNumber
      WHERE oi.orderId = ?
      ORDER BY oi.rowid ASC
    `).all(orderId);

    res.status(200).json({ ...updated, items: updatedItems });
  } catch (err) {
    console.error('PUT /api/orders/:id failed:', err);
    res.status(500).json({ error: 'Failed to update order' });
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
// Delete Order Route
// =====================
app.delete('/api/orders/:id', (req, res) => {
  const id = req.params.id;
  db.prepare('DELETE FROM order_items WHERE orderId = ?').run(id);
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  res.json({ success: true });
});


// =====================
// Server Start
// =====================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
