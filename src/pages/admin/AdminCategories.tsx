import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Category } from '../../types';
import { Plus, Trash2, Tag, Save } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/error-handler';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    // Listen to categories in real-time
    const q = query(collection(db, 'categories'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      setFetching(false);
    }, (error) => {
      console.error('Error fetching categories:', error);
      if (error.message.includes('requires an index')) {
        onSnapshot(collection(db, 'categories'), (fallbackSnap) => {
          setCategories(fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
          setFetching(false);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategory,
        createdAt: serverTimestamp(),
      });
      setNewCategory('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories', auth);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('এই ক্যাটাগরি ডিলিট করলে এর অধীনের পণ্যগুলো খুঁজে পাওয়া যাবে না। নিশ্চিত ডিলিট করতে চান?')) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-black text-slate-800 font-bengali">ক্যাটাগরি ম্যানেজমেন্ট</h1>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg">
        <form onSubmit={handleAdd} className="space-y-4">
          <label className="block text-sm font-bold text-slate-600 font-bengali flex items-center gap-2">
            <Plus className="w-4 h-4 text-green-600" />
            নতুন ক্যাটাগরি যোগ করুন
          </label>
          <div className="flex gap-4">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="ক্যাটাগরির নাম (যেমন: ঘি, মধু)"
              className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bengali shadow-inner"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold font-bengali flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 shadow-md transition-all active:scale-95"
            >
              <Save className="w-5 h-5" />
              সেভ
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <Tag className="w-5 h-5 text-slate-400" />
          <h2 className="font-bold text-slate-800 font-bengali uppercase text-sm tracking-wider">বিদ্যমান ক্যাটাগরিসমূহ</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {categories.length > 0 ? categories.map((cat) => (
            <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors px-8">
              <span className="font-bold text-slate-700 font-bengali text-lg">{cat.name}</span>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )) : (
            <div className="p-12 text-center text-slate-400 font-bengali">কোনো ক্যাটাগরি নেই।</div>
          )}
        </div>
      </div>
    </div>
  );
}
