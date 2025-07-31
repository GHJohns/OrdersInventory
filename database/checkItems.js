const db = require('./db');

const rows = db.prepare('SELECT * FROM items ORDER BY id DESC LIMIT 10').all();
console.log(rows);
