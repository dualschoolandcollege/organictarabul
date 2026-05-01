import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, OrderStatus } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShoppingCart, Phone, MapPin, User, CheckCircle2, ChevronLeft, Package, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const orderSchema = z.object({
  customerName: z.string().optional(),
  mobileNumber: z.string().min(11, 'সঠিক মোবাইল নম্বর দিন (১১ ডিজিট)'),
  address: z.string().optional(),
  packageIndex: z.string(),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      packageIndex: '0',
    }
  });

  const selectedPackageIndexString = watch('packageIndex');
  const selectedPackageIndex = parseInt(selectedPackageIndexString) || 0;

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const onSubmit = async (data: OrderFormData) => {
    if (!product) return;
    try {
      const idx = parseInt(data.packageIndex);
      const selectedPackage = product.packages[idx];
      await addDoc(collection(db, 'orders'), {
        userId: user?.uid || null,
        productId: product.id,
        productName: product.name,
        package: selectedPackage?.name || 'Default',
        price: selectedPackage?.price || product.price,
        customerName: data.customerName || 'Guest User',
        mobileNumber: data.mobileNumber,
        address: data.address || '',
        status: OrderStatus.PENDING,
        createdAt: serverTimestamp(),
      });
      setOrderSuccess(true);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('অর্ডার সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bengali">লোড হচ্ছে...</div>;
  if (!product) return <div className="text-center py-20 font-bengali text-xl">পণ্যটি খুঁজে পাওয়া যায়নি।</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors font-bengali">
        <ChevronLeft className="w-4 h-4" />
        হোম পেজে ফিরে যান
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Media Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm relative">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={product.images[activeImage] || 'https://via.placeholder.com/600x600'}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
            {product.videoUrl && (
              <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold font-bengali flex items-center gap-1 shadow-lg">
                <PlayCircle className="w-3 h-3" />
                ভিডিও আছে
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  activeImage === idx ? 'border-green-500 scale-105' : 'border-transparent opacity-70'
                }`}
              >
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {product.videoUrl && (
            <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative group">
              <h4 className="font-bengali font-bold mb-4 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-red-500" />
                প্রোডাক্ট ভিডিও
              </h4>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-800">
                {product.videoUrl.includes('youtube.com') || product.videoUrl.includes('youtu.be') ? (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${new URL(product.videoUrl).searchParams.get('v') || product.videoUrl.split('/').pop()}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video src={product.videoUrl} controls className="w-full h-full"></video>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Info & Order Form */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 font-bengali leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-green-600 font-bengali">
                ৳{product.packages[selectedPackageIndex]?.price || product.price}
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold font-bengali uppercase">ইন স্টক</span>
            </div>
            <p className="text-slate-600 font-bengali leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>

          <div className="h-px bg-slate-100" />

          {!orderSuccess ? (
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md space-y-6">
              <h3 className="text-xl font-bold text-slate-800 font-bengali flex items-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                এখনই অর্ডার করুন
              </h3>
              
              <div className="space-y-4">
                {/* Package Selection */}
                {product.packages?.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 font-bengali flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      প্যাকেজ নির্বাচন করুন
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {product.packages.map((pkg, idx) => (
                        <label 
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedPackageIndex === idx 
                              ? 'border-green-500 bg-green-50 outline-none' 
                              : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <input 
                            type="radio" 
                            {...register('packageIndex')} 
                            value={idx} 
                            className="hidden"
                          />
                          <span className="font-bengali font-medium text-slate-700">{pkg.name}</span>
                          <span className="font-bold text-green-600 font-bengali text-sm select-none">৳{pkg.price}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 font-bengali flex items-center gap-2">
                    <User className="w-4 h-4" />
                    আপনার নাম (ঐচ্ছিক)
                  </label>
                  <input
                    {...register('customerName')}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bengali transition-shadow"
                    placeholder="নাম লিখুন"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 font-bengali flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-600" />
                    মোবাইল নম্বর (আবশ্যিক)
                  </label>
                  <input
                    {...register('mobileNumber')}
                    className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bengali transition-shadow ${errors.mobileNumber ? 'ring-2 ring-red-500' : ''}`}
                    placeholder="যেমন: 01700000000"
                  />
                  {errors.mobileNumber && <p className="text-red-500 text-xs font-bengali">{errors.mobileNumber.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 font-bengali flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    ডেলিভারি ঠিকানা (ঐচ্ছিক)
                  </label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 font-bengali transition-shadow resize-none"
                    placeholder="গ্রাম, পোস্ট অফিস, থানা, জেলা..."
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold font-bengali text-xl hover:bg-green-700 hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
              >
                <ShoppingCart className="w-6 h-6" />
                অর্ডার নিশ্চিত করুন
              </button>
              
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 font-bengali">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> ক্যাশ অন ডেলিভারি</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> ৭ দিনের রিটার্ন পলিসি</span>
              </div>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 p-12 rounded-3xl border-2 border-green-200 text-center space-y-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-200 text-green-700 rounded-full">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-green-800 font-bengali">ধন্যবাদ! আপনার অর্ডারটি সফল হয়েছে।</h2>
                <p className="text-green-700 font-bengali text-lg leading-relaxed">
                  অল্প সময়ের মধ্যেই আমাদের প্রতিনিধি আপনার সাথে মোবাইলে যোগাযোগ করবেন।
                </p>
              </div>
              <button 
                onClick={() => setOrderSuccess(false)}
                className="text-green-600 font-bold font-bengali hover:underline"
              >
                আবার অর্ডার করুন
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
