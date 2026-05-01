import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category, Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Search, Filter, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch Categories
        const catQuery = query(collection(db, 'categories'), orderBy('name'));
        const catSnap = await getDocs(catQuery);
        const catList = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(catList);

        // Fetch Products
        const prodQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const prodSnap = await getDocs(prodQuery);
        const prodList = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(prodList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden bg-green-900 flex items-center justify-center p-8">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        <div className="relative text-center max-w-2xl space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-green-400 font-bengali font-bold"
          >
            <Leaf className="w-5 h-5" />
            অর্গানিক এবং ফ্রেশ
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-white font-bengali leading-tight"
          >
            সেরা মানের অর্গানিক পণ্য খুজুন এবং অর্ডার করুন
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center bg-white rounded-2xl p-2 shadow-2xl max-w-md mx-auto"
          >
            <div className="pl-4 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="পণ্য সার্চ করুন..."
              className="w-full px-4 py-2 border-none focus:ring-0 font-bengali text-slate-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filter */}
        <aside className="lg:col-span-1 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-bengali mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              ক্যাটাগরি
            </h2>
            <div className="flex flex-wrap lg:flex-col gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm font-bengali transition-all text-left ${
                  selectedCategory === 'all' 
                    ? 'bg-green-600 text-white font-bold shadow-md' 
                    : 'bg-white text-slate-600 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                সব পণ্য
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bengali transition-all text-left ${
                    selectedCategory === cat.id 
                      ? 'bg-green-600 text-white font-bold shadow-md' 
                      : 'bg-white text-slate-600 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 text-slate-400 rounded-full mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-bengali">কোনো পণ্য পাওয়া যায়নি</h3>
              <p className="text-slate-500 mt-2 font-bengali">অন্য কোনো নাম বা ক্যাটাগরি দিয়ে চেষ্টা করুন</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
