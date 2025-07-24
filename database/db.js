const Database = require('better-sqlite3');

const db = new Database('orders_inventory.db', {
  verbose: console.log
});

// Create tables (do this once at startup)
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

db.prepare(`
  CREATE TABLE IF NOT EXISTS variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT,
    itemNumber TEXT,
    location TEXT,
    backstockLocation TEXT,
    color1 TEXT,
    color2 TEXT,
    accentColor TEXT,
    frameFinish TEXT,
    lensColor TEXT,
    lensFinish TEXT
  )
`).run();

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
    quantity INTEGER
  )
`).run();

console.log('Database and tables ready!');

module.exports = db;





