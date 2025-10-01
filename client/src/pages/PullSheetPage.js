import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function PullSheetPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  // normalize helper
  const normalizeOrderResponse = (raw) => {
    const base = raw?.order ? raw.order : (raw || {});
    let items = base.items || raw?.items || raw?.orderItems || [];
    if (!Array.isArray(items)) items = [];

    const normItems = items.map((it) => ({
      itemNumber: it.itemNumber ?? it.sku ?? it.SKU ?? '',
      name: it.name ?? it.description ?? it.itemName ?? it.title ?? it.itemNumber ?? '',
      collection: it.collection ?? it.Collection ?? '',
      category: it.category ?? it.Category ?? '',
      quantity: Number(it.quantity ?? it.qty ?? it.Qty ?? 0)
    }));
    return { ...base, items: normItems };
  };

  useEffect(() => {
    if (!orderId) {
      setError('No Order ID provided.');
      return;
    }

    fetch(`http://localhost:5000/api/orders/${orderId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Order not found.');
        let data = {};
        try { data = await res.json(); } catch (_) {}
        const normalized = normalizeOrderResponse(data);

        // sort: Category -> Collection -> ItemNumber
        const categoryOrder = ['Standard','Xtreme','Polarized','Kids','Kids Xtreme','Retainers','Racks'];
        if (Array.isArray(normalized.items)) {
          normalized.items.sort((a, b) => {
            const catA = a.category || '';
            const catB = b.category || '';
            const idxA = categoryOrder.indexOf(catA);
            const idxB = categoryOrder.indexOf(catB);
            if (idxA !== -1 && idxB !== -1) {
              if (idxA !== idxB) return idxA - idxB;
              const collA = a.collection || '';
              const collB = b.collection || '';
              if (collA !== collB) return collA.localeCompare(collB);
              return (a.itemNumber || '').localeCompare(b.itemNumber || '');
            }
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return (a.itemNumber || '').localeCompare(b.itemNumber || '');
          });
        }
        setOrder(normalized);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load order.');
      });
  }, [orderId]);

  // submit/process (unchanged)
  const handleSubmitOrder = async () => {
    if (!window.confirm('Submit this order and update inventory?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/process`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to submit order.');
      alert('Order submitted and inventory updated.');
    } catch (e) {
      alert(e.message);
    }
  };

  // NEW: “Edit Order” just navigates back with a query param so OrdersPage can prefill
  const handleEditOrder = () => {
    navigate(`/orders?editOrderId=${orderId}`);
  };

  if (error) {
    return (
      <div>
        <h2>Pull Sheet Error</h2>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <Link to="/orders">&larr; Back to Orders</Link>
      </div>
    );
  }

  if (!order) {
    return <p style={{ padding: '20px' }}>Loading pull sheet...</p>;
  }

  const items = order.items || [];
  const hasItems = items.length > 0;

  const categoryTotals = {};
  items.forEach(item => {
    const cat = item.category || 'Uncategorized';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(item.quantity) || 0);
  });
  const totalQuantity = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  const cellStyle = { border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left' };

  return (
    <div className="pull-sheet" style={{ maxWidth: '800px', margin: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Pull Sheet — Order #{order.id ?? order.orderId ?? order.order_id ?? orderId}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleEditOrder}>Edit Order</button>
          <button className="btn btn-primary" onClick={handleSubmitOrder}>Submit Order</button>
        </div>
      </div>

      <p><strong>Customer:</strong> {order.customerName || order.customer || 'N/A'}</p>
      <p><strong>Notes:</strong> {order.notes || order.specialNotes || '—'}</p>
      <p><strong>Total Quantity:</strong> {totalQuantity}</p>

      <button onClick={() => window.print()} style={{ marginBottom: 20 }}>Print Pull Sheet</button>

      {hasItems ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={cellStyle}>Category</th>
              <th style={cellStyle}>Item</th>
              <th style={cellStyle}>Collection</th>
              <th style={cellStyle}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={(item.itemNumber || '') + idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                <td style={cellStyle}>{item.category || ''}</td>
                <td style={cellStyle}>{item.name || item.itemNumber || ''}</td>
                <td style={cellStyle}>{item.collection || ''}</td>
                <td style={cellStyle}>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ marginTop: 16, padding: 12, border: '1px dashed #ccc', background: '#fafafa' }}>
          No items found for this order.
        </div>
      )}

      {hasItems && (
        <>
          <h3 style={{ marginTop: 30 }}>Category Totals</h3>
          <ul>
            {Object.entries(categoryTotals).map(([category, total]) => (
              <li key={category}><strong>{category}:</strong> {total}</li>
            ))}
          </ul>
        </>
      )}

      <Link to="/orders" style={{ display: 'inline-block', marginTop: 20 }}>
        &larr; Back to Orders
      </Link>

      {/* Footer for print (unchanged) */}
      <div className="print-footer" style={{ marginTop: '50px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
          <div style={{ textAlign: 'left' }}>
            <div>📞 (843) 626-7900</div>
            <div>📧 SunRayz843@gmail.com</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <img src="https://api.qrserver.com/v1/create-qr-code/?data=https://sun-rayz.com&size=80x80" alt="QR Code" />
            <div style={{ fontSize: '10pt' }}>https://sun-rayz.com</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {new Date(order.createdAt || order.created_at || Date.now()).toLocaleString()}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          button, a { display: none !important; }
          html, body { height: 100%; margin: 0; padding: 0; }
          .pull-sheet { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          table { font-size: 12pt !important; border-collapse: collapse !important; width: 100% !important; border: 1px solid #ccc !important; page-break-inside: avoid; }
          th, td { border: 1px solid #ccc !important; padding: 6px 8px !important; text-align: left !important; }
          thead { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          tr:nth-child(even) { background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          tr:nth-child(odd) { background-color: #fff !important; }
          h1, h2, h3 { margin: 0 !important; }
          .print-footer { page-break-inside: avoid; margin-top: auto; padding: 20px 40px; font-size: 10pt; display: flex; justify-content: space-between; align-items: center; }
          ul { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
