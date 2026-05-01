import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { auth } from '../lib/firebase';
import { ShoppingBag, User, LogOut, LayoutDashboard, Home } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-green-600 p-2 rounded-lg">
            <ShoppingBag className="text-white w-5 h-5" />
          </div>
          <span className="font-bengali font-bold text-xl text-slate-800">অর্গানিক তারাবুল</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="Home">
            <Home className="w-5 h-5" />
          </Link>
          
          {isAdmin && (
            <Link 
              to="/admin" 
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
              title="Admin Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>এডমিন প্যানেল</span>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/my-orders" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="My Orders">
                <ShoppingBag className="w-5 h-5" />
              </Link>
              <span className="hidden md:inline text-sm text-slate-500">{user.email}</span>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                to="/login" 
                className="px-4 py-2 text-slate-600 hover:text-green-600 transition-colors font-bengali font-medium"
              >
                লগইন
              </Link>
              <Link 
                to="/login?mode=signup" 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bengali font-medium flex items-center gap-2 shadow-sm"
              >
                সাইন আপ
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
