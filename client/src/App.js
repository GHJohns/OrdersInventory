import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import PullSheetPage from './pages/PullSheetPage';

function App() {
  return (
    <Router>
      <div style={{ maxWidth: 800, margin: 'auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
        <h1>Sun Rayz Premium Eyewear</h1>

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








