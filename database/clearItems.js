const db = require('./db'); // adjust if needed

// Clear the items table
db.prepare("DELETE FROM items").run();

// Reset auto-increment ID
db.prepare("DELETE FROM sqlite_sequence WHERE name = 'items'").run();

console.log("Items table cleared and ID sequence reset.");
