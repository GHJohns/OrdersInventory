import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

export default function OrdersPage() {
  const [itemsList, setItemsList] = useState([]);
  const [orderRows, setOrderRows] = useState([{ itemNumber: '', quantity: 1 }]);
  const [customerName, setCustomerName] = useState('');
  const [orders, setOrders] = useState([]);
  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');


  useEffect(() => {
    fetch('http://localhost:5000/api/items')
      .then(res => res.json())
      .then(data => setItemsList(data))
      .catch(err => console.error(err));
  }, []);

  const loadOrders = useCallback(() => {
    fetch('http://localhost:5000/api/orders')
      .then(res => res.json())
      .then(data => {
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
            if (!order.customerName?.toLowerCase().includes(filterName.toLowerCase())) return false;
          }
          return true;
        });
        setOrders(filtered);
      })
      .catch(err => console.error(err));
  }, [filterName, filterDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRowChange = (idx, field, value) => {
    const updated = [...orderRows];
    updated[idx] = { ...updated[idx], [field]: value };
    setOrderRows(updated);
  };

  const handleTab = (idx) => {
    if (idx === orderRows.length - 1) {
      setOrderRows([...orderRows, { itemNumber: '', quantity: 1 }]);
    }
  };

  const getSuggestions = (value) => {
    const input = value.toLowerCase();
    if (!input) return [];
    return itemsList.filter(item =>
      item.itemNumber.replace(/^[A-Z]_/, '').startsWith(input)
    );
  };

  const submitOrder = () => {
    const validItems = orderRows
      .filter(r => r.itemNumber && Number(r.quantity) > 0)
      .map(r => ({
        itemNumber: r.itemNumber.trim(),
        quantity: Number(r.quantity)
      }));

    if (!customerName.trim()) {
      alert('Please enter a customer name.');
      return;
    }
    if (validItems.length === 0) {
      alert('Add at least one valid item.');
      return;
    }

    fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName, notes, items: validItems }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to submit order');
        return res.json();
      })
      .then(() => {
        alert('Order submitted!');
        setOrderRows([{ itemNumber: '', quantity: 1 }]);
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
    orderRows.some(r => r.itemNumber && Number(r.quantity) > 0) &&
    customerName.trim() !== '';

  // Keep track of focused suggestion for arrows
  const [focusedIdx, setFocusedIdx] = useState(null);

  return (
    <div style={{ display: 'flex', gap: 30 }}>
      <div style={{ flex: 1 }}>
        <h2>New Order</h2>
        <label>Customer Name:</label><br />
        <input
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
          placeholder="Customer Name"
        />

        <label>Notes:</label><br />
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Special instructions or notes..."
          style={{ width: '100%', marginBottom: 10, minHeight: 60 }}
        />


        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Item Number</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {orderRows.map((row, idx) => {
              const suggestions = getSuggestions(row.itemNumber);
              return (
                <tr key={idx} style={{ position: 'relative' }}>
                  <td>
                    <input
                      value={row.itemNumber}
                      onChange={e => {
                        handleRowChange(idx, 'itemNumber', e.target.value);
                        setFocusedIdx(0);
                      }}
                      onKeyDown={e => {
                        if (suggestions.length) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setFocusedIdx(focusedIdx < suggestions.length - 1 ? focusedIdx + 1 : 0);
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setFocusedIdx(focusedIdx > 0 ? focusedIdx - 1 : suggestions.length - 1);
                          } else if (e.key === 'Enter' && focusedIdx !== null) {
                            e.preventDefault();
                            handleRowChange(idx, 'itemNumber', suggestions[focusedIdx].itemNumber);
                            setFocusedIdx(null);
                          }
                        }
                      }}
                      style={{ width: '100%' }}
                    />
                    {suggestions.length > 0 && row.itemNumber && (
                      <div style={{
                        position: 'absolute',
                        background: '#fff',
                        border: '1px solid #ddd',
                        width: '100%',
                        zIndex: 10,
                      }}>
                        {suggestions.slice(0, 5).map((s, sidx) => (
                          <div
                            key={s.itemNumber}
                            onClick={() => {
                              handleRowChange(idx, 'itemNumber', s.itemNumber);
                              setFocusedIdx(null);
                            }}
                            style={{
                              padding: '5px',
                              cursor: 'pointer',
                              background: focusedIdx === sidx ? '#eee' : '#fff',
                            }}
                          >
                            {s.itemNumber}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={e => handleRowChange(idx, 'quantity', e.target.value)}
                      onKeyDown={e => { if (e.key === 'Tab') handleTab(idx); }}
                      style={{ width: '100%' }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button
          onClick={submitOrder}
          disabled={!canSubmit}
          style={{ marginTop: 20 }}
        >
          Submit Order
        </button>
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      </div>

      <div style={{ flex: 1 }}>
        <h2>Orders</h2>
        <label>Filter by Name:</label><br />
        <input
          value={filterName}
          onChange={e => setFilterName(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        />
        <label>Filter by Date:</label>
        <button onClick={clearFilters} style={{ marginLeft: 10 }}>Clear</button><br />
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        />

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {orders.length === 0 && <li>No orders found.</li>}
          {orders.map(order => (
            <li key={order.id} style={{ borderBottom: '1px solid #ddd', marginBottom: 10 }}>
              <Link to={`/orders/${order.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <strong>Order ID:</strong> {order.id}<br />
                <strong>Customer:</strong> {order.customerName}<br />
                <strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}<br />
                {order.notes && (<><strong>Notes:</strong> {order.notes}<br /></>)}

                <strong>Items:</strong> {order.items.length}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
