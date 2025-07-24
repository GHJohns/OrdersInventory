import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

export default function OrdersPage() {
  const [orderRows, setOrderRows] = useState(Array(50).fill({ itemNumber: '', quantity: '' }));
  const [orders, setOrders] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [error, setError] = useState('');

  const loadOrders = useCallback(() => {
    fetch('http://localhost:5000/api/orders')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load orders');
        return res.json();
      })
      .then(data => {
        setError('');

        let selectedDate, nextDate;
        if (filterDate) {
          selectedDate = new Date(filterDate);
          selectedDate.setHours(0, 0, 0, 0);
          nextDate = new Date(selectedDate);
          nextDate.setDate(nextDate.getDate() + 1);
        }

        const filtered = data.filter(order => {
          if (filterDate) {
            const orderDate = new Date(order.createdAt);
            if (orderDate < selectedDate || orderDate >= nextDate) return false;
          }
          if (filterName) {
            if (
              !order.customerName ||
              !order.customerName.toLowerCase().includes(filterName.toLowerCase())
            ) {
              return false;
            }
          }
          return true;
        });
        setOrders(filtered);
      })
      .catch(err => setError(err.message));
  }, [filterName, filterDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRowChange = (index, field, value) => {
    const updated = [...orderRows];
    updated[index] = { ...updated[index], [field]: value };
    setOrderRows(updated);
  };

  const addMoreRows = () => {
    setOrderRows([...orderRows, ...Array(50).fill({ itemNumber: '', quantity: '' })]);
  };

  const submitOrder = () => {
    const validItems = orderRows
      .filter(row => row.itemNumber && row.quantity && Number(row.quantity) > 0)
      .map(row => ({ itemNumber: row.itemNumber.trim(), quantity: Number(row.quantity) }));

    if (validItems.length === 0) {
      alert('Please enter at least one valid item.');
      return;
    }
    if (!customerName.trim()) {
      alert('Please enter a customer name.');
      return;
    }

    fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: customerName.trim(), items: validItems }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create order');
        return res.json();
      })
      .then(() => {
        alert('Order submitted!');
        setOrderRows(Array(50).fill({ itemNumber: '', quantity: '' }));
        setCustomerName('');
        loadOrders();
      })
      .catch(err => setError(err.message));
  };

  const clearFilters = () => {
    setFilterName('');
    setFilterDate('');
  };

  const canSubmit =
    orderRows.some(row => row.itemNumber && row.quantity && Number(row.quantity) > 0) &&
    customerName.trim() !== '';

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <h2>New Order</h2>
        <label>Customer Name:</label>
        <br />
        <input
          type="text"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
          placeholder="Enter customer/company name"
        />

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Item Number</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {orderRows.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <input
                    type="text"
                    value={row.itemNumber}
                    onChange={e => handleRowChange(idx, 'itemNumber', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.quantity}
                    min="0"
                    onChange={e => handleRowChange(idx, 'quantity', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={addMoreRows}>Add 50 More Rows</button>
        <button onClick={submitOrder} style={{ marginLeft: 10 }} disabled={!canSubmit}>
          Submit Order
        </button>

        {error && (
          <div style={{ color: 'red', marginTop: 10, fontWeight: 'bold' }}>Error: {error}</div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <h2>Orders</h2>
        <label>Filter by Customer Name:</label>
        <br />
        <input
          type="text"
          value={filterName}
          onChange={e => setFilterName(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
          placeholder="Filter by customer/company name"
        />
        <label>Filter by Date:</label>
        <button
          onClick={clearFilters}
          style={{ marginLeft: 10, fontSize: '0.8rem', padding: '2px 8px' }}
          title="Clear filters"
        >
          Clear Filters
        </button>
        <br />
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        />

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {orders.length === 0 && <li>No orders found.</li>}
          {orders.map(order => (
            <li
              key={order.id}
              style={{
                borderBottom: '1px solid #ccc',
                marginBottom: 10,
                cursor: 'pointer',
                padding: '10px 0',
              }}
            >
              <Link
                to={`/orders/${order.id}`} // ✅ Fix: matches App.js Route!
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <strong>Order ID:</strong> {order.id}
                <br />
                <strong>Customer:</strong> {order.customerName || '(No name)'}
                <br />
                <strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}
                <br />
                <strong>Total Qty:</strong> {order.totalQuantity}
                <br />
                {order.items.length > 0 ? (
                  order.items.map(item => (
                    <div key={item.id}>
                      - {item.itemNumber}: {item.quantity}
                    </div>
                  ))
                ) : (
                  <div>No items</div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
