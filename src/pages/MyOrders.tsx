import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Order, OrderStatus } from '../types';
import { ShoppingBag, Package, Clock, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyOrders() {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const ordersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Order));
        setOrders(ordersList);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchMyOrders();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="flex h-[60vh] items-center justify-center font-bengali">লোড হচ্ছে...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 text-slate-400 rounded-full">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 font-bengali">আপনি লগইন করেননি</h2>
        <p className="text-slate-500 font-bengali">আপনার অর্ডার ইতিহাস দেখতে দয়া করে লগইন করুন।</p>
        <Link to="/login" className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-bold font-bengali shadow-lg">
          লগইন করুন
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-800 font-bengali">আমার অর্ডারসমূহ</h1>
        <div className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-bold font-bengali">
          মোট অর্ডার: {orders.length}
        </div>
      </div>

      <div className="space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={order.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-sm border border-green-100 shrink-0">
                  <Package className="w-8 h-8" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-800 font-bengali">{order.productName}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-bengali uppercase tracking-wider ${
                      order.status === OrderStatus.PENDING ? 'bg-orange-100 text-orange-600' :
                      order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-600' :
                      order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {order.status === OrderStatus.PENDING ? 'পেন্ডিং' : 
                       order.status === OrderStatus.PROCESSING ? 'প্রসেসিং' : 
                       order.status === OrderStatus.SHIPPED ? 'শিপড' : 
                       order.status === OrderStatus.DELIVERED ? 'ডেলিভার্ড' : 'ক্যান্সেল'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-bengali">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {order.createdAt ? format(order.createdAt.toDate(), 'PPP', { locale: bn }) : 'অপেক্ষিত'}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-green-600">
                      ৳{order.price} ({order.package})
                    </span>
                  </div>
                </div>

                <Link 
                  to={`/product/${order.productId}`}
                  className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-bengali text-sm font-medium"
                >
                  আবার দেখুন
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex flex-wrap gap-6 text-xs text-slate-400 font-bengali">
                <span>অর্ডার আইডি: #{order.id.slice(0, 8)}</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> ক্যাশ অন ডেলিভারি</span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-slate-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 text-slate-200 rounded-full mb-4">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 font-bengali">আপনার কোনো অর্ডার নেই</h3>
            <p className="text-slate-400 mt-2 font-bengali">এখনই আমাদের সেরা ডিলগুলো দেখুন!</p>
            <Link to="/" className="inline-block mt-6 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold font-bengali shadow-md hover:bg-slate-800 transition-all">
              কেনাকাটা শুরু করুন
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
