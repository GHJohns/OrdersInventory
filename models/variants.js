// models/variants.js
const db = require('../database/db');

// Get all variants
function getAllVariants() {
  const stmt = db.prepare('SELECT * FROM variants');
  return stmt.all();
}

// Get variant by ID
function getVariantById(id) {
  const stmt = db.prepare('SELECT * FROM variants WHERE id = ?');
  return stmt.get(id);
}

// Add variant
function addVariant(data) {
  const stmt = db.prepare(`
    INSERT INTO variants (
      sku, itemNumber, location, backstockLocation,
      color1, color2, accentColor, frameFinish, lensColor, lensFinish
    ) VALUES (
      @sku, @itemNumber, @location, @backstockLocation,
      @color1, @color2, @accentColor, @frameFinish, @lensColor, @lensFinish
    )
  `);
  const info = stmt.run(data);
  return info.lastInsertRowid;
}

// Update variant
function updateVariant(id, data) {
  const stmt = db.prepare(`
    UPDATE variants
    SET sku = @sku,
        itemNumber = @itemNumber,
        location = @location,
        backstockLocation = @backstockLocation,
        color1 = @color1,
        color2 = @color2,
        accentColor = @accentColor,
        frameFinish = @frameFinish,
        lensColor = @lensColor,
        lensFinish = @lensFinish
    WHERE id = @id
  `);
  return stmt.run({ ...data, id });
}

// Delete variant
function deleteVariant(id) {
  const stmt = db.prepare('DELETE FROM variants WHERE id = ?');
  return stmt.run(id);
}

module.exports = {
  getAllVariants,
  getVariantById,
  addVariant,
  updateVariant,
  deleteVariant
};
