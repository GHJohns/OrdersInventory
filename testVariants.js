// testVariants.js
const db = require('./database/db'); // to ensure tables exist
const variants = require('./models/variants');

console.log('Database and tables ready!');

// Get all variants
console.log('SELECT * FROM variants');
console.log('All variants:', variants.getAllVariants());

// Add new variant
const newId = variants.addVariant({
  sku: 'SKU123',
  itemNumber: '12345',
  location: 'A1',
  backstockLocation: 'B1',
  color1: 'Red',
  color2: 'Black',
  accentColor: 'Gold',
  frameFinish: 'Matte',
  lensColor: 'Blue',
  lensFinish: 'Mirrored'
});
console.log(`Added new variant with ID: ${newId}`);

// Get by ID
console.log('SELECT * FROM variants WHERE id =', newId);
console.log('Get variant by ID:', variants.getVariantById(newId));

// Update
variants.updateVariant(newId, {
  sku: 'SKU123',
  itemNumber: '12345',
  location: 'A2',
  backstockLocation: 'B2',
  color1: 'Green',
  color2: 'Black',
  accentColor: 'Silver',
  frameFinish: 'Glossy',
  lensColor: 'Gray',
  lensFinish: 'Polarized'
});
console.log('Variant after update:', variants.getVariantById(newId));

// Delete
variants.deleteVariant(newId);
console.log('All variants after delete:', variants.getAllVariants());

