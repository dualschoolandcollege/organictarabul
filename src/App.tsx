/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import Login from './pages/Login';
import MyOrders from './pages/MyOrders';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isVerified, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">লোড হচ্ছে...</div>;
  if (!isVerified) return <Navigate to="/login" />;
  return isAdmin ? <>{children}</> : <Navigate to="/login" />;
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isVerified, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">লোড হচ্ছে...</div>;
  if (user && !isVerified) return <Navigate to="/login" />;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const GuestOrVerifiedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isVerified, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">লোড হচ্ছে...</div>;
  if (user && !isVerified) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen font-sans">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<GuestOrVerifiedRoute><Home /></GuestOrVerifiedRoute>} />
              <Route path="/product/:id" element={<GuestOrVerifiedRoute><ProductDetail /></GuestOrVerifiedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/my-orders" element={<PrivateRoute><MyOrders /></PrivateRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
              <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              
              {/* Fallback for unverified users trying to "enter" deeper */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
