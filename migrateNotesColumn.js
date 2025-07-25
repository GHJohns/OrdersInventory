const db = require('./database/db');

try {
  db.prepare('ALTER TABLE orders ADD COLUMN notes TEXT').run();
  console.log('✅ Notes column added to orders table.');
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('ℹ️ Notes column already exists.');
  } else {
    console.error('❌ Error adding notes column:', err.message);
  }
}
