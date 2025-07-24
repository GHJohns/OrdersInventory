// models/items.js
const db = require('../database/db');

// Get all items
function getAllItems() {
  const stmt = db.prepare('SELECT * FROM items');
  return stmt.all();
}

// Get item by ID
function getItemById(id) {
  const stmt = db.prepare('SELECT * FROM items WHERE id = ?');
  return stmt.get(id);
}

// Add item
function addItem(data) {
  const stmt = db.prepare(`
    INSERT INTO items (itemNumber, name, inventory, type, category, collection, style, special, imageURL)
    VALUES (@itemNumber, @name, @inventory, @type, @category, @collection, @style, @special, COALESCE(@imageURL, ''))
  `);

  const info = stmt.run(data);
  return info.lastInsertRowid;
}

// Update item
function updateItem(id, data) {
  const stmt = db.prepare(`
    UPDATE items
    SET itemNumber = @itemNumber,
        name = @name,
        inventory = @inventory,
        type = @type,
        category = @category,
        collection = @collection,
        style = @style,
        special = @special,
        imageURL = COALESCE(@imageURL, '')
    WHERE id = @id
  `);
  return stmt.run({ ...data, id });
}


// Delete item
function deleteItem(id) {
  const stmt = db.prepare('DELETE FROM items WHERE id = ?');
  return stmt.run(id);
}

module.exports = {
  getAllItems,
  getItemById,
  addItem,
  updateItem,
  deleteItem
};

