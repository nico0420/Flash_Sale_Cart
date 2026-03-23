import React from 'react';
import { Product, useCart } from '../context/CartContext';
import { ShoppingCart, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  isSaleActive: boolean;
}

export function ProductCard({ product, isSaleActive }: ProductCardProps) {
  const { addToCart, cart } = useCart();
  
  const cartItem = cart.find(item => item.id === product.id);
  const currentQuantityInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock === 0;
  const canAddToCart = isSaleActive && !isOutOfStock && currentQuantityInCart < product.stock;

  const discountPercentage = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden">
      {/* Discount Badge */}
      <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
        -{discountPercentage}%
      </div>

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-white text-slate-900 font-bold px-6 py-2 rounded-full shadow-lg transform -rotate-12 text-lg">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight">
            {product.name}
          </h3>
        </div>
        
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="mt-auto">
          <div className="flex items-end gap-2 mb-4">
            <span className="text-3xl font-black text-indigo-600">
              ${product.price}
            </span>
            <span className="text-sm text-slate-400 line-through mb-1 font-medium">
              ${product.originalPrice}
            </span>
          </div>

          {/* Stock Indicator */}
          <div className="mb-4">
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className={product.stock < 5 ? 'text-red-500' : 'text-slate-500'}>
                {product.stock === 0 
                  ? 'Out of stock' 
                  : product.stock < 5 
                    ? `Only ${product.stock} left!` 
                    : `${product.stock} in stock`}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  product.stock < 5 ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (product.stock / 10) * 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => addToCart(product)}
            disabled={!canAddToCart}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-200 ${
              canAddToCart
                ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {isOutOfStock 
              ? 'Out of Stock' 
              : !isSaleActive 
                ? 'Sale Ended' 
                : currentQuantityInCart >= product.stock
                  ? 'Max Reached'
                  : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
