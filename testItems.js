// testItems.js
const db = require('./database/db'); // <-- keeps tables created
const items = require('./models/items');

// Confirm tables exist (will log the create statements)
console.log('Database and tables ready!');

// Get all items
console.log('SELECT * FROM items');
console.log('All items:', items.getAllItems());

// Add new item
const newId = items.addItem({
  itemNumber: '54321',
  name: 'Test Glasses 2',
  inventory: 50,
  type: 'TypeB',
  category: 'CategoryB',
  collection: 'CollectionB',
  style: 'StyleB',
  special: 'None',
  imageURL: 'http://example.com/image2.jpg'
});
console.log(`Added new item with ID: ${newId}`);

// Get by ID
console.log('SELECT * FROM items WHERE id =', newId);
console.log('Get item by ID:', items.getItemById(newId));

// Update
items.updateItem(newId, {
  itemNumber: '54321',
  name: 'Updated Glasses',
  inventory: 45,
  type: 'TypeB',
  category: 'CategoryB',
  collection: 'CollectionB',
  style: 'StyleB',
  special: 'Updated feature',
  imageURL: 'http://example.com/image2-updated.jpg'
});
console.log('Item after update:', items.getItemById(newId));

// Delete
items.deleteItem(newId);
console.log('All items after delete:', items.getAllItems());
