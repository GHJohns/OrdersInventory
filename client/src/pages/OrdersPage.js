import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function OrdersPage() {
  const [itemsList, setItemsList] = useState([]);
  const [orderRows, setOrderRows] = useState([{ itemNumber: '', quantity: 1 }]);
  const [customerName, setCustomerName] = useState('');
  const [orders, setOrders] = useState([]);
  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [copiedOrder, setCopiedOrder] = useState(null);
  const [focusedIdx, setFocusedIdx] = useState(null); // for suggestions

  // NEW: track if we're editing an existing order
  const [editingOrderId, setEditingOrderId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Load items once
  useEffect(() => {
    fetch('http://localhost:5000/api/items')
      .then(res => res.json())
      .then(data => setItemsList(data))
      .catch(err => console.error(err));
  }, []);

  // Load orders with default: newest-first and limit 20
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

        // Apply filters if provided
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

        // Always sort newest-first
        const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Default display: previous 20 orders (most recent first)
        const limited = (!filterName && !filterDate) ? sorted.slice(0, 20) : sorted;

        setOrders(limited);
      })
      .catch(err => console.error(err));
  }, [filterName, filterDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Prefill support for legacy ?editOrderId (kept in case you linked from Pull Sheet)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('editOrderId');
    if (!editId) return;

    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/${editId}`);
        if (!res.ok) throw new Error('Failed to load order for editing');
        const data = await res.json();

        const base = data?.order ? data.order : data;
        const items = (base.items || data.items || data.orderItems || []).map(it => ({
          itemNumber: it.itemNumber ?? it.sku ?? it.SKU ?? '',
          quantity: Number(it.quantity ?? it.qty ?? it.Qty ?? 0) || 1
        }));

        setEditingOrderId(Number(editId));
        setCustomerName(base.customerName || base.customer || '');
        setNotes(base.notes || base.specialNotes || '');
        setOrderRows(items.length ? items : [{ itemNumber: '', quantity: 1 }]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [location.search]);

  // ---- New Order form helpers ----
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

  // === CHANGED: Preview Order handles create vs. update-in-place ===
  const previewOrder = () => {
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

    const payload = { customerName, notes, items: validItems };

    // EDITING an existing order → PUT (keep same ID), then go to its Pull Sheet
    // inside previewOrder(), editing branch only
// inside previewOrder(), editing branch
if (editingOrderId) {
  fetch(`http://localhost:5000/api/orders/${editingOrderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName, notes, items: validItems, touchTimestamp: true })
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Failed to update order');
      }
      const updated = await res.json(); // server returns updated order
      return updated.id;
    })
    .then((id) => {
      navigate(`/pull-sheet/${id}`);
      setError('');
      loadOrders();
    })
    .catch(err => setError(err.message));
  return;
}



    // CREATING a new order → POST, then go to new Pull Sheet
    fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || 'Failed to create order');
        }
        let body = {};
        try { body = await res.json(); } catch (_) {}
        const createdId = body.id ?? body.orderId ?? body.order_id;
        if (createdId) return createdId;

        // Fallback: find most recent match if API didn’t return an id
        const ordersRes = await fetch('http://localhost:5000/api/orders');
        if (!ordersRes.ok) throw new Error('Order created but could not retrieve list.');
        const all = await ordersRes.json();
        const sorted = [...all].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (db !== da) return db - da;
          if (typeof b.id === 'number' && typeof a.id === 'number') return b.id - a.id;
          return 0;
        });
        const wantedSet = new Set(payload.items.map(i => i.itemNumber));
        const candidate = sorted.find(o => {
          if ((o.customerName || '').trim() !== payload.customerName.trim()) return false;
          if (!Array.isArray(o.items)) return false;
          const set = new Set(o.items.map(i => i.itemNumber));
          if (set.size !== wantedSet.size) return false;
          for (const k of wantedSet) if (!set.has(k)) return false;
          return true;
        });
        if (!candidate || !candidate.id) throw new Error('Order created but ID is unknown.');
        return candidate.id;
      })
      .then((orderId) => {
        navigate(`/pull-sheet/${orderId}`);
        // reset local state for new-order flow only
        setOrderRows([{ itemNumber: '', quantity: 1 }]);
        setCustomerName('');
        setNotes('');
        setEditingOrderId(null);
        setError('');
        loadOrders();
      })
      .catch(err => setError(err.message));
  };

  // ---- Copy/Delete/Submit Copied Order (unchanged) ----
  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    fetch(`http://localhost:5000/api/orders/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete order');
        // if deleting the one being edited, reset the form
        if (editingOrderId === id) {
          setEditingOrderId(null);
          setCustomerName('');
          setNotes('');
          setOrderRows([{ itemNumber: '', quantity: 1 }]);
        }
        loadOrders();
      })
      .catch(err => alert(err.message));
  };

  const submitCopiedOrder = () => {
    const validItems = copiedOrder.items.filter(r => r.itemNumber && Number(r.quantity) > 0);
    if (!copiedOrder.customerName.trim() || validItems.length === 0) {
      alert('Fill in a valid customer and items');
      return;
    }

    fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: copiedOrder.customerName,
        notes: copiedOrder.notes,
        items: validItems
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to submit copied order');
        return res.json();
      })
      .then(() => {
        alert('Copied order submitted!');
        setCopiedOrder(null);
        loadOrders();
      })
      .catch(err => alert(err.message));
  };

  const clearFilters = () => {
    setFilterName('');
    setFilterDate('');
  };

  const copyToNewOrderForm = (order) => {
    setEditingOrderId(null); // copy creates a new order, not edit
    setCustomerName(order.customerName + ' (copy)');
    setNotes(order.notes || '');
    const rows = order.items.map(item => ({
      itemNumber: item.itemNumber,
      quantity: item.quantity
    }));
    setOrderRows(rows.length ? rows : [{ itemNumber: '', quantity: 1 }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // NEW: Start edit in-place (keep the same order id)
  const startEditOrder = async (order) => {
    try {
      // ensure we have the freshest version from API
      const res = await fetch(`http://localhost:5000/api/orders/${order.id}`);
      const data = res.ok ? await res.json() : order; // fallback to given order
      const base = data?.order ? data.order : data;
      const items = (base.items || data.items || data.orderItems || []).map(it => ({
        itemNumber: it.itemNumber ?? it.sku ?? it.SKU ?? '',
        quantity: Number(it.quantity ?? it.qty ?? it.Qty ?? 0) || 1
      }));
      setEditingOrderId(order.id);
      setCustomerName(base.customerName || base.customer || '');
      setNotes(base.notes || base.specialNotes || '');
      setOrderRows(items.length ? items : [{ itemNumber: '', quantity: 1 }]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // minimal fallback: use the list item we clicked
      setEditingOrderId(order.id);
      setCustomerName(order.customerName || '');
      setNotes(order.notes || '');
      const rows = (order.items || []).map(it => ({ itemNumber: it.itemNumber, quantity: it.quantity }));
      setOrderRows(rows.length ? rows : [{ itemNumber: '', quantity: 1 }]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canPreview =
    orderRows.some(r => r.itemNumber && Number(r.quantity) > 0) &&
    customerName.trim() !== '';

  return (
    <div style={{ display: 'flex', gap: 30 }}>
      <div style={{ flex: 1 }}>
        <h2>{editingOrderId ? `Edit Order #${editingOrderId}` : 'New Order'}</h2>

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

        {/* CHANGED: Submit → Preview (handles create vs update) */}
        <button
          onClick={previewOrder}
          disabled={!canPreview}
          style={{ marginTop: 20 }}
        >
          Preview Order
        </button>

        {/* Optional cancel editing to revert to "new order" mode */}
        {editingOrderId && (
          <button
            onClick={() => {
              setEditingOrderId(null);
              setCustomerName('');
              setNotes('');
              setOrderRows([{ itemNumber: '', quantity: 1 }]);
            }}
            style={{ marginTop: 20, marginLeft: 10 }}
          >
            Cancel Edit
          </button>
        )}

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

              <div style={{ marginTop: 5 }}>
                {/* NEW: Edit (in-place, same ID) */}
                <button onClick={() => startEditOrder(order)} style={{ marginRight: 10 }}>
                  Edit
                </button>

                <button onClick={() => copyToNewOrderForm(order)} style={{ marginRight: 10 }}>
                  Copy
                </button>

                <button onClick={() => handleDelete(order.id)} style={{ color: 'red' }}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        {copiedOrder && (
          <div style={{ marginTop: 30, padding: 15, border: '1px solid #ccc' }}>
            <h3>Copied Order</h3>
            <label>Customer Name:</label><br />
            <input
              value={copiedOrder.customerName}
              onChange={e => setCopiedOrder({ ...copiedOrder, customerName: e.target.value })}
              style={{ width: '100%', marginBottom: 10 }}
            />

            <label>Notes:</label><br />
            <textarea
              value={copiedOrder.notes}
              onChange={e => setCopiedOrder({ ...copiedOrder, notes: e.target.value })}
              style={{ width: '100%', marginBottom: 10 }}
            />

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
              <thead>
                <tr>
                  <th>Item Number</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {copiedOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.itemNumber}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => {
                          const updated = [...copiedOrder.items];
                          updated[idx].quantity = parseInt(e.target.value, 10) || 1;
                          setCopiedOrder({ ...copiedOrder, items: updated });
                        }}
                        style={{ width: 60 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={submitCopiedOrder}>Submit Copied Order</button>
            <button onClick={() => setCopiedOrder(null)} style={{ marginLeft: 10 }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
