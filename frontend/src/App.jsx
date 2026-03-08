import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import Profile from './pages/Profile';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import useAuthStore from './store/authStore';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="product/:slug" element={<ProductPage />} />
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
          <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="contact-us" element={<ContactUs />} />
          <Route path="terms-conditions" element={<Terms />} />
          <Route path="privacy-policy" element={<Privacy />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
