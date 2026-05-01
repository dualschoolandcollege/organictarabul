import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ListTree, ShoppingCart, TrendingUp, Users, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export default function AdminDashboard() {
  const [counts, setCounts] = React.useState({
    products: 0,
    categories: 0,
    orders: 0,
    admins: 0
  });
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [pSnap, cSnap, oSnap, aSnap, rSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'categories')),
          getDocs(query(collection(db, 'orders'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'users'), where('role', '==', 'admin'))),
          getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5)))
        ]);

        setCounts({
          products: pSnap.size,
          categories: cSnap.size,
          orders: oSnap.size,
          admins: aSnap.size
        });
        setRecentOrders(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      } catch (e: any) {
        console.error('Dashboard fetch error:', e);
        if (e.message?.includes('permission')) {
          setError('আপনার অ্যাডমিন অ্যাক্সেস এখনও পুরোপুরি কার্যকর হয়নি। দয়া করে কয়েক সেকেন্ড পর পেজটি রিফ্রেশ করুন।');
        } else {
          setError('তথ্য লোড করতে সমস্যা হয়েছে।');
        }
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    { label: 'মোট পণ্য', value: counts.products.toString(), icon: Package, color: 'bg-blue-100 text-blue-600', link: '/admin/products' },
    { label: 'ক্যাটাগরি', value: counts.categories.toString(), icon: ListTree, color: 'bg-purple-100 text-purple-600', link: '/admin/categories' },
    { label: 'নতুন অর্ডার', value: counts.orders.toString(), icon: ShoppingCart, color: 'bg-green-100 text-green-600', link: '/admin/orders' },
    { label: 'অ্যাডমিন', value: counts.admins.toString(), icon: Users, color: 'bg-red-100 text-red-600', link: '/admin/users' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-800 font-bengali">এডমিন ড্যাশবোর্ড</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-bengali">
          <Clock className="w-4 h-4" />
          মার্চ ৩০, ২০২৬
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 font-bengali text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4"
          >
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 font-bengali">{stat.label}</p>
              <p className="text-3xl font-black text-slate-800 font-bengali">{stat.value}</p>
            </div>
            <Link to={stat.link} className="block text-xs font-bold text-green-600 hover:underline font-bengali">
              বিস্তারিত দেখুন →
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-800 font-bengali">দ্রুত অ্যাকশন</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin/products" className="p-4 bg-slate-50 hover:bg-green-50 hover:border-green-200 border-2 border-transparent rounded-2xl transition-all group">
              <Package className="w-8 h-8 text-slate-400 group-hover:text-green-600 mb-2 transition-colors" />
              <p className="font-bold text-slate-700 font-bengali">নতুন পণ্য যোগ করুন</p>
              <p className="text-xs text-slate-400 font-bengali mt-1">পণ্য আপলোড এবং এডিট</p>
            </Link>
            <Link to="/admin/categories" className="p-4 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border-2 border-transparent rounded-2xl transition-all group">
              <ListTree className="w-8 h-8 text-slate-400 group-hover:text-purple-600 mb-2 transition-colors" />
              <p className="font-bold text-slate-700 font-bengali">ক্যাটাগরি ম্যানেজ</p>
              <p className="text-xs text-slate-400 font-bengali mt-1">নতুন বিভাগ তৈরি করুন</p>
            </Link>
            <Link to="/admin/users" className="p-4 bg-slate-50 hover:bg-red-50 hover:border-red-200 border-2 border-transparent rounded-2xl transition-all group">
              <Users className="w-8 h-8 text-slate-400 group-hover:text-red-600 mb-2 transition-colors" />
              <p className="font-bold text-slate-700 font-bengali">ইউজার ম্যানেজ</p>
              <p className="text-xs text-slate-400 font-bengali mt-1">অ্যাডমিন যোগ/বাতিল</p>
            </Link>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-800 font-bengali flex items-center justify-between">
            সাম্প্রতিক অর্ডার
            <Link to="/admin/orders" className="text-sm text-green-600 hover:underline">সবগুলো দেখুন</Link>
          </h2>
          <div className="space-y-4">
            {recentOrders.length > 0 ? recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 font-bengali text-sm">{order.productName}</p>
                    <p className="text-[10px] text-slate-400 font-bengali">অর্ডার #{order.id.slice(0, 6)}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-bengali ${
                  order.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                }`}>
                  {order.status}
                </span>
              </div>
            )) : (
              <p className="text-center py-10 text-slate-400 font-bengali">কোনো সাম্প্রতিক অর্ডার নেই</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
