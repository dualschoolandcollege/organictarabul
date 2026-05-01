import React, { useState, useEffect } from 'react';
import { collection, updateDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, OrderStatus } from '../../types';
import { ShoppingCart, User, Phone, MapPin, Clock, CheckCircle2, ChevronRight, Package, Search } from 'lucide-react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Listen to orders in real-time
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    }, (error) => {
       console.error('Error fetching orders:', error);
       if (error.message.includes('requires an index')) {
         onSnapshot(collection(db, 'orders'), (fallbackSnap) => {
           setOrders(fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
           setLoading(false);
         });
       }
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (e) {
      console.error('Error updating order:', e);
      alert('অর্ডার আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filter === 'all' || o.status === filter;
    const matchesSearch = o.customerName?.toLowerCase().includes(search.toLowerCase()) || 
                          o.mobileNumber.includes(search) ||
                          o.productName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-slate-800 font-bengali">অর্ডার ম্যানেজমেন্ট</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-green-600 transition-colors" />
            <input 
              type="text" 
              placeholder="সার্চ (নাম/মোবাইল)..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 font-bengali text-sm w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 font-bengali text-sm outline-none"
          >
            <option value="all">সব অর্ডার</option>
            {Object.values(OrderStatus).map(s => (
              <option key={s} value={s}>{s === OrderStatus.PENDING ? 'পেন্ডিং' : 
                                       s === OrderStatus.PROCESSING ? 'প্রসেসিং' : 
                                       s === OrderStatus.SHIPPED ? 'শিপড' : 
                                       s === OrderStatus.DELIVERED ? 'ডেলিভার্ড' : 'ক্যান্সেল'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.length > 0 ? filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/3 p-8 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 font-bengali leading-none mb-1">{order.customerName}</p>
                  <p className="text-xs text-slate-400 font-bengali">অর্ডার আইডি: #{order.id.slice(0, 6)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 font-bengali">
                  <Phone className="w-4 h-4 text-green-600" />
                  {order.mobileNumber}
                </div>
                {order.address && (
                  <div className="flex items-start gap-2 text-sm text-slate-600 font-bengali">
                    <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-1" />
                    <span className="leading-relaxed">{order.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400 font-bengali">
                  <Clock className="w-4 h-4" />
                  {order.createdAt ? format(order.createdAt.toDate(), 'PPP p', { locale: bn }) : 'কিছুক্ষণ আগে'}
                </div>
              </div>
            </div>

            <div className="flex-1 p-8 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm text-slate-400">
                  <Package className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-black text-slate-800 font-bengali">{order.productName}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bengali">{order.package}</span>
                    <span className="text-lg font-black text-slate-600 font-bengali">৳{order.price}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 font-sans uppercase tracking-widest">Status:</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    className={`px-4 py-2 border rounded-xl text-sm font-bold font-bengali outline-none transition-all ${
                      order.status === OrderStatus.PENDING ? 'bg-orange-50 border-orange-200 text-orange-600' :
                      order.status === OrderStatus.DELIVERED ? 'bg-green-50 border-green-200 text-green-600' :
                      order.status === OrderStatus.CANCELLED ? 'bg-red-50 border-red-200 text-red-600' :
                      'bg-blue-50 border-blue-200 text-blue-600'
                    }`}
                  >
                    <option value={OrderStatus.PENDING}>পেন্ডিং</option>
                    <option value={OrderStatus.PROCESSING}>প্রসেসিং</option>
                    <option value={OrderStatus.SHIPPED}>শিপড</option>
                    <option value={OrderStatus.DELIVERED}>ডেলিভার্ড</option>
                    <option value={OrderStatus.CANCELLED}>ক্যান্সেল</option>
                  </select>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bengali justify-end">
                   <CheckCircle2 className="w-3 h-3" /> রিয়েল টাইম আপডেট
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-slate-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 text-slate-200 rounded-full mb-4">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 font-bengali">কোনো অর্ডার পাওয়া যায়নি</h3>
            <p className="text-slate-400 mt-2 font-bengali">বর্তমানে কোনো সক্রিয় অর্ডার নেই।</p>
          </div>
        )}
      </div>
    </div>
  );
}
