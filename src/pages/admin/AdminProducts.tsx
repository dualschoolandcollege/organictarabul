import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Product, Category } from '../../types';
import { useForm, useFieldArray } from 'react-hook-form';
import { Package, Plus, Trash2, Image as ImageIcon, Video, Save, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductForm {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  videoUrl: string;
  imageFiles: FileList;
  packages: { name: string; price: number }[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>({
    defaultValues: {
      packages: [{ name: '', price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "packages"
  });

  useEffect(() => {
    setLoading(true);
    // Listen to products in real-time
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
      const pData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(pData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      // Sometimes orderBy requires an index that might not exist yet,
      // fallback to un-ordered fetch if it fails initially
      if (error.message.includes('requires an index')) {
        onSnapshot(collection(db, 'products'), (fallbackSnap) => {
          setProducts(fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
          setLoading(false);
        });
      }
    });

    // Listen to categories
    const cq = query(collection(db, 'categories'), orderBy('name'));
    const unsubscribeCategories = onSnapshot(cq, (snapshot) => {
      setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  const onSubmit = async (data: ProductForm) => {
    setUploading(true);
    try {
      const imageUrls = [];
      const imageFiles = data.imageFiles;
      
      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          imageUrls.push(url);
        }
      }

      const productData = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        price: Number(data.price),
        images: imageUrls,
        videoUrl: data.videoUrl || '',
        packages: data.packages.map((p: any) => ({ name: p.name, price: Number(p.price) })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'products'), productData);
      reset();
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('পণ্য যোগ করতে সমস্যা হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('আপনি কি নিশ্চিত যে এই পণ্যটি ডিলিট করতে চান?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-800 font-bengali">পণ্য ম্যানেজমেন্ট</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold font-bengali flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isAdding ? 'বন্ধ করুন' : 'নতুন পণ্য'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 font-bengali mb-1">পণ্যের নাম</label>
                    <input {...register('name', { required: true })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bengali" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 font-bengali mb-1">ক্যাটাগরি</label>
                    <select {...register('categoryId', { required: true })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bengali">
                      <option value="">নির্বাচন করুন</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 font-bengali mb-1">মূল মূল্য (বেস প্রাইস)</label>
                    <input type="number" {...register('price', { required: true })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bengali" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 font-bengali mb-1">বর্ণনা (Description)</label>
                    <textarea {...register('description', { required: true })} rows={4} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bengali resize-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 font-bengali mb-1 flex items-center gap-2">
                       <ImageIcon className="w-4 h-4 text-blue-500" />
                       ছবি আপলোড করুন (এক বা একাধিক)
                    </label>
                    <input type="file" multiple {...register('imageFiles')} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 font-bengali mb-1 flex items-center gap-2">
                      <Video className="w-4 h-4 text-red-500" />
                      ভিডিও লিঙ্ক (YouTube URL বা ডিরেক্ট লিঙ্ক)
                    </label>
                    <input {...register('videoUrl')} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bengali" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-600 font-bengali">প্যাকেজসমূহ (যেমন: ৫০০ গ্রাম, ১ কেজি)</label>
                      <button type="button" onClick={() => append({ name: '', price: 0 })} className="text-green-600 text-xs font-bold font-bengali flex items-center gap-1">
                        <Plus className="w-3 h-3" /> আরও যোগ করুন
                      </button>
                    </div>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-center">
                        <input {...register(`packages.${index}.name` as const)} placeholder="নাম" className="flex-1 px-3 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-green-500 font-bengali text-sm" />
                        <input type="number" {...register(`packages.${index}.price` as const)} placeholder="দাম" className="w-24 px-3 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-green-500 font-bengali text-sm" />
                        {index > 0 && <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold font-bengali text-lg hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {uploading ? 'আপলোড হচ্ছে...' : 'পণ্য সেভ করুন'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Price</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <img src={p.images[0] || 'https://via.placeholder.com/40' } className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                    <span className="font-bold text-slate-700 font-bengali">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold font-bengali">
                    {categories.find(c => c.id === p.categoryId)?.name || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-green-600 font-bengali">৳{p.price}</span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
