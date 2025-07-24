// index.js
const db = require('./database/db');

// Insert a test item
const insert = db.prepare(`INSERT INTO items (itemNumber, name, inventory, type, category, collection, style, special, imageURL) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
insert.run('12345', 'Test Sunglass', 100, 'TypeA', 'CategoryA', 'CollectionA', 'StyleA', 'SpecialFeature', 'http://example.com/image.jpg');

// Query all items
const select = db.prepare(`SELECT * FROM items`);
const items = select.all();

console.log(items);
