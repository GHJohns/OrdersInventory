import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import PullSheetPage from './pages/PullSheetPage';

function App() {
  return (
    <Router>
      <div style={{ maxWidth: 800, margin: 'auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
        <h1><img
  src="https://sun-rayz.com/cdn/shop/files/test_230x.png?v=1632410189"
  alt="Sun Rayz Logo"
  style={{ maxHeight: 80, marginBottom: 20 }}
/>
</h1>

        <nav style={{ marginBottom: 20 }}>
          <Link to="/products" style={{ marginRight: 10 }}>Products</Link>
          <Link to="/orders">Orders</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/products" />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<PullSheetPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;








