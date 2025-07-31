const db = require('.');

const rows = db.prepare('SELECT * FROM items ORDER BY id DESC LIMIT 10').all();
console.log(rows);
