import React, { useEffect, useState } from 'react';

function ProductsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  const [itemNumber, setItemNumber] = useState('');
  const [name, setName] = useState('');
  const [inventory, setInventory] = useState(0);
  const [type, setType] = useState('Sunglasses');
  const [category, setCategory] = useState('');
  const [collection, setCollection] = useState('');
  const [style, setStyle] = useState('');
  const [special, setSpecial] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    fetch('http://localhost:5000/api/items')
      .then(res => res.json())
      .then(setItems)
      .catch(err => setError(err.message));
  };

  const uniqueOptions = (field) =>
    Array.from(new Set(items.map(item => item[field]).filter(Boolean)));

  useEffect(() => {
    if (!itemNumber) return setCategory('');
    if (/^(A_|S_|R_|F_)/.test(itemNumber)) setCategory('Standard');
    else if (itemNumber.startsWith('P_')) setCategory('Polarized');
    else if (itemNumber.startsWith('X_')) setCategory('Extreme Shield');
    else if (/^(KB_|KG_|KU_)/.test(itemNumber)) setCategory('Kids');
    else if (itemNumber.startsWith('KX_')) setCategory('Kids (Extreme Shield)');
    else setCategory('');
  }, [itemNumber]);

  const resetForm = () => {
    setItemNumber('');
    setName('');
    setInventory(0);
    setType('Sunglasses');
    setCategory('');
    setCollection('');
    setStyle('');
    setSpecial('');
    setImageURL('');
    setEditingId(null);
    setError(null);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const itemData = {
      itemNumber, name, inventory: Number(inventory),
      type, category, collection, style, special, imageURL
    };
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `http://localhost:5000/api/items/${editingId}`
      : 'http://localhost:5000/api/items';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to save item');
        return res.json();
      })
      .then(() => {
        loadItems();
        resetForm();
      })
      .catch(err => setError(err.message));
  };

  const onEdit = (item) => {
    setEditingId(item.id);
    setItemNumber(item.itemNumber || '');
    setName(item.name || '');
    setInventory(item.inventory || 0);
    setType(item.type || 'Sunglasses');
    setCategory(item.category || '');
    setCollection(item.collection || '');
    setStyle(item.style || '');
    setSpecial(item.special || '');
    setImageURL(item.imageURL || '');
  };

  const onDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    fetch(`http://localhost:5000/api/items/${id}`, { method: 'DELETE' })
      .then(() => loadItems())
      .catch(err => setError(err.message));
  };

  const toggleCategory = (cat) =>
    setSelectedCategories(
      selectedCategories.includes(cat)
        ? selectedCategories.filter(c => c !== cat)
        : [...selectedCategories, cat]
    );

  const toggleCollection = (col) =>
    setSelectedCollections(
      selectedCollections.includes(col)
        ? selectedCollections.filter(c => c !== col)
        : [...selectedCollections, col]
    );

  const filteredItems = items.filter(item => {
    const matchesSearch =
      !searchTerm ||
      (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemNumber?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCollection =
      selectedCollections.length === 0 || selectedCollections.includes(item.collection);

    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(item.category);

    return matchesSearch && matchesCollection && matchesCategory;
  });

  return (
    <div>
      <h2>Products</h2>
      {error && <div style={{ color: 'red', marginBottom: 10 }}>Error: {error}</div>}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '30px' }}>
        <div style={{ flex: 1 }}>
          {/* Filters */}
          <div style={{ marginBottom: 20 }}>
            <label>Search:</label><br />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name or item number..."
              style={{ width: '100%', marginBottom: 10 }}
            />

            <div style={{ marginBottom: 20 }}>
              <strong>Filter by Category:</strong><br />
              {uniqueOptions('category').map(cat => (
                <label key={cat} style={{ marginRight: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <strong>Filter by Collection:</strong><br />
              {uniqueOptions('collection').map(col => (
                <label key={col} style={{ marginRight: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedCollections.includes(col)}
                    onChange={() => toggleCollection(col)}
                  />
                  {col}
                </label>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} style={{ marginBottom: 20, border: '1px solid #ccc', padding: 15, borderRadius: 5 }}>
            <h3>{editingId ? 'Edit Item' : 'Add Item'}</h3>

            <label>Item Number:</label><br />
            <input type="text" value={itemNumber} onChange={e => setItemNumber(e.target.value)} required style={{ width: '100%', marginBottom: 10 }} />

            <label>Name:</label><br />
            <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', marginBottom: 10 }} />

            <label>Inventory:</label><br />
            <input type="number" value={inventory} onChange={e => setInventory(e.target.value)} min="0" style={{ width: '100%', marginBottom: 10 }} />

            <label>Type:</label><br />
            <input list="typeOptions" value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
            <datalist id="typeOptions">
              <option value="Sunglasses" />
              <option value="Accessories" />
              <option value="Other" />
            </datalist>

            <label>Category:</label><br />
            <input list="categoryOptions" value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
            <datalist id="categoryOptions">
              {uniqueOptions('category').map(opt => <option key={opt} value={opt} />)}
            </datalist>

            <label>Collection:</label><br />
            <input list="collectionOptions" value={collection} onChange={e => setCollection(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
            <datalist id="collectionOptions">
              {uniqueOptions('collection').map(opt => <option key={opt} value={opt} />)}
            </datalist>

            <label>Style:</label><br />
            <input list="styleOptions" value={style} onChange={e => setStyle(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
            <datalist id="styleOptions">
              {uniqueOptions('style').map(opt => <option key={opt} value={opt} />)}
            </datalist>

            <label>Special:</label><br />
            <input list="specialOptions" value={special} onChange={e => setSpecial(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
            <datalist id="specialOptions">
              {uniqueOptions('special').map(opt => <option key={opt} value={opt} />)}
            </datalist>

            <label>Image URL:</label><br />
            <input type="text" value={imageURL} onChange={e => setImageURL(e.target.value)} placeholder="https://..." style={{ width: '100%', marginBottom: 10 }} />

            <button type="submit" style={{ padding: '8px 16px', marginRight: 10 }}>
              {editingId ? 'Update Item' : 'Add Item'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} style={{ padding: '8px 16px' }}>
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* Filtered Items List */}
        <div style={{ flex: 2 }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {filteredItems.map(item => (
              <li key={item.id} style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
                <strong>{item.name}</strong> (Inventory: {item.inventory})<br />
                Item Number: {item.itemNumber} | Type: {item.type} | Category: {item.category}<br />
                Collection: {item.collection} | Style: {item.style} | Special: {item.special}<br />
                {item.imageURL && (
                  <div>
                    <img src={item.imageURL} alt="" style={{ maxWidth: 100, marginTop: 5 }} />
                  </div>
                )}
                <button onClick={() => onEdit(item)} style={{ marginRight: 10 }}>Edit</button>
                <button onClick={() => onDelete(item.id)} style={{ color: 'red' }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
