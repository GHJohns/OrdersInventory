import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import PullSheetPage from './pages/PullSheetPage';

function App() {
  return (
    <Router>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
  <img
    src="https://sun-rayz.com/cdn/shop/files/test_230x.png?v=1632410189"
    alt="Sun Rayz Logo"
    style={{ height: 100 }}
  />
  </div>

      <div>
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








