import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function PullSheetPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setError('No Order ID provided.');
      return;
    }

    fetch(`http://localhost:5000/api/orders/${orderId}`)
      .then(res => {
        if (!res.ok) throw new Error('Order not found.');
        return res.json();
      })
      .then(data => {
        if (!data || !data.id) throw new Error('Invalid order data.');
        // Sort items by itemNumber
        if (data.items && Array.isArray(data.items)) {
          data.items.sort((a, b) => a.itemNumber.localeCompare(b.itemNumber));
        }
        setOrder(data);
      })
      .catch(err => setError(err.message));
  }, [orderId]);

  if (error) {
    return (
      <div>
        <h2>Pull Sheet Error</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <Link to="/orders">&larr; Back to Orders</Link>
      </div>
    );
  }

  if (!order) return <p>Loading pull sheet...</p>;

  // Group totals by category
  const categoryTotals = {};
  order.items?.forEach(item => {
    const cat = item.category || 'Uncategorized';
    if (!categoryTotals[cat]) categoryTotals[cat] = 0;
    categoryTotals[cat] += item.quantity;
  });

  return (
    <div className="pull-sheet" style={{ maxWidth: '800px', margin: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Pull Sheet</h1>
      <h2>Order #{order.id}</h2>
      <p><strong>Customer:</strong> {order.customerName || 'N/A'}</p>
      <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</p>
      <p><strong>Total Quantity:</strong> {order.totalQuantity}</p>

      <button onClick={() => window.print()} style={{ marginBottom: '20px' }}>
        Print Pull Sheet
      </button>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>Item Number</th>
            <th style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>Name</th>
            <th style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>Category</th>
            <th style={{ borderBottom: '1px solid #333', textAlign: 'right' }}>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {order.items && order.items.length > 0 ? (
            order.items.map(item => (
              <tr key={`${item.id}-${item.itemNumber}`}>
                <td>{item.itemNumber}</td>
                <td>{item.name}</td>
                <td>{item.category || 'Uncategorized'}</td>
                <td style={{ textAlign: 'right' }}>{item.quantity}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No items in this order.</td></tr>
          )}
        </tbody>
      </table>

      <h3 style={{ marginTop: '30px' }}>Category Totals</h3>
      <ul>
        {Object.entries(categoryTotals).map(([category, total]) => (
          <li key={category}><strong>{category}:</strong> {total}</li>
        ))}
      </ul>

      <Link to="/orders" style={{ display: 'inline-block', marginTop: '20px' }}>
        &larr; Back to Orders
      </Link>

      {/* Inline print styles */}
      <style>{`
        @media print {
          button, a {
            display: none !important;
          }
          body {
            background: #fff;
          }
          .pull-sheet {
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
          table {
            font-size: 12pt;
          }
          h1, h2, h3 {
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
