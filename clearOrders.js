// clearOrders.js
const db = require('./database/db');

db.prepare('DELETE FROM order_items').run();
db.prepare('DELETE FROM orders').run();
db.prepare("DELETE FROM sqlite_sequence WHERE name = 'orders'").run();
db.prepare("DELETE FROM sqlite_sequence WHERE name = 'order_items'").run();

console.log('Orders and related order_items cleared. ID sequences reset.');
