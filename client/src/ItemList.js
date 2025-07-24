import React, { useState, useEffect } from 'react';

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetch('http://localhost:3000/api/items')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading items...</p>;
  if (error) return <p>Error loading items: {error}</p>;

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.name} - Inventory: {item.inventory}
        </li>
      ))}
    </ul>
  );
}
