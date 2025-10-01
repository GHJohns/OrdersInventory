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
        if (data.items && Array.isArray(data.items)) {
          const categoryOrder = [
            'Standard',
            'Xtreme',
            'Polarized',
            'Kids',
            'Kids Xtreme',
            'Retainers',
            'Racks'
          ];

data.items.sort((a, b) => {
  const catA = a.category || '';
  const catB = b.category || '';
  const idxA = categoryOrder.indexOf(catA);
  const idxB = categoryOrder.indexOf(catB);

  // If both categories are in the list, sort by index
  if (idxA !== -1 && idxB !== -1) {
    if (idxA !== idxB) return idxA - idxB;
    // Same category → sort by collection, then itemNumber
    const collA = a.collection || '';
    const collB = b.collection || '';
    if (collA !== collB) return collA.localeCompare(collB);
    return a.itemNumber.localeCompare(b.itemNumber);
  }

  // If only one is in the list, it comes first
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;

  // Neither in list → fallback to default
  return a.itemNumber.localeCompare(b.itemNumber);
});

        }
        setOrder(data);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message);
      });
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

  if (!order || !Array.isArray(order.items)) {
    return <p style={{ padding: '20px' }}>Loading pull sheet...</p>;
  }

  const categoryTotals = {};
  order.items.forEach(item => {
    const cat = item.category || 'Uncategorized';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + item.quantity;
  });

  const cellStyle = {
    border: '1px solid #ccc',
    padding: '6px 8px',
    textAlign: 'left'
  };

  return (
    
    <div className="pull-sheet" style={{ maxWidth: '800px', margin: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Centered Logo */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        
      </div>

      <p><strong>Customer:</strong> {order.customerName || 'N/A'}</p>
      <p><strong>Notes:</strong> {order.notes || '—'}</p>
      <p><strong>Total Quantity:</strong> {order.totalQuantity}</p>

      <button onClick={() => window.print()} style={{ marginBottom: 20 }}>Print Pull Sheet</button>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '1px solid #ccc'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={cellStyle}>Category</th>            
            <th style={cellStyle}>Item</th>            
            <th style={cellStyle}>Collection</th>
            <th style={cellStyle}>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={item.itemNumber} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              <td style={cellStyle}>{item.category}</td>              
              <td style={cellStyle}>{item.name}</td>              
              <td style={cellStyle}>{item.collection}</td>
              <td style={cellStyle}>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 30 }}>Category Totals</h3>
      <ul>
        {Object.entries(categoryTotals).map(([category, total]) => (
          <li key={category}><strong>{category}:</strong> {total}</li>
        ))}
      </ul>

      <Link to="/orders" style={{ display: 'inline-block', marginTop: 20 }}>
        &larr; Back to Orders
      </Link>

      {/* Footer for print */}
      <div className="print-footer" style={{ marginTop: '50px' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
    <div style={{ textAlign: 'left' }}>
      <div>📞 (843) 626-7900</div>
      <div>📧 SunRayz843@gmail.com</div>
    </div>

    <div style={{ textAlign: 'center' }}>
      <img
        src="https://api.qrserver.com/v1/create-qr-code/?data=https://sun-rayz.com&size=80x80"
        alt="QR Code"
      />
      <div style={{ fontSize: '10pt' }}>https://sun-rayz.com</div>
    </div>

    <div style={{ textAlign: 'right' }}>
      {new Date(order.createdAt).toLocaleString()}
    </div>
  </div>
</div>


      <style>{`
        @media print {
  button, a {
    display: none !important;
  }

  html, body {
    height: 100%;
    margin: 0;
    padding: 0;
  }

  .pull-sheet {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  table {
    font-size: 12pt !important;
    border-collapse: collapse !important;
    width: 100% !important;
    border: 1px solid #ccc !important;
    page-break-inside: avoid;
  }

  th, td {
    border: 1px solid #ccc !important;
    padding: 6px 8px !important;
    text-align: left !important;
  }

  thead {
    background-color: #f0f0f0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  tr:nth-child(odd) {
    background-color: #fff !important;
  }

  h1, h2, h3 {
    margin: 0 !important;
  }

  .print-footer {
    page-break-inside: avoid;
    margin-top: auto;
    padding: 20px 40px;
    font-size: 10pt;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  ul {
    page-break-inside: avoid;
  }
}

      `}</style>
    </div>
  );
}
