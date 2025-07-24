// migrateAddCreatedAt.js
const path = require('path');
const Database = require('better-sqlite3');

// Adjust path to your database file location relative to this script
const dbPath = path.resolve(__dirname, '../orders_inventory.db');
const db = new Database(dbPath, { verbose: console.log });

try {
  // Check if 'createdAt' column exists already
  const pragma = db.prepare(`PRAGMA table_info(orders)`).all();
  const hasCreatedAt = pragma.some(column => column.name === 'createdAt');

  if (!hasCreatedAt) {
    console.log("Adding 'createdAt' column to 'orders' table...");

    // Add createdAt column with default current timestamp
    db.prepare(`
      ALTER TABLE orders
      ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    `).run();

    console.log("'createdAt' column added successfully.");
  } else {
    console.log("'createdAt' column already exists.");
  }
} catch (err) {
  console.error("Migration failed:", err);
}

db.close();
