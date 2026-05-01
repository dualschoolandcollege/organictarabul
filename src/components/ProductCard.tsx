import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { ShoppingCart, Eye, Tag } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group"
    >
      <Link to={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-slate-100">
        <img 
          src={product.images[0] || 'https://via.placeholder.com/400x400?text=No+Image'} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-green-700 flex items-center gap-1 shadow-sm font-bengali">
            <Tag className="w-3 h-3" />
            সেরা পণ্য
          </div>
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-slate-800 font-bengali mb-2 line-clamp-1">
          {product.name}
        </h3>
        
        <p className="text-slate-500 text-sm font-bengali mb-4 line-clamp-2 h-10">
          {product.description}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bengali">মূল্য</span>
            <span className="text-xl font-bold text-green-600 font-bengali">৳{product.price}</span>
          </div>

          <Link 
            to={`/product/${product.id}`}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors font-bengali"
          >
            <Eye className="w-4 h-4" />
            দেখুন
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
