'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { ShoppingCart, Check, Store, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@markethub/shared';
import { apiRequest } from '../lib/api';
import { useAuth } from '../lib/auth-context';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    priceMinor: number;
    compareAtPriceMinor?: number;
    sku: string;
    availableStock: number;
    vendor: {
      id: string;
      storeName: string;
      slug: string;
    };
    category: {
      name: string;
      slug: string;
    };
    images: Array<{ url: string; altText?: string }>;
    reviewsCount?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { refreshCartCount } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0].url
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600';

  const isOutOfStock = product.availableStock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock || isAdding) return;

    setIsAdding(true);
    try {
      const res = await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      if (res.success) {
        setAdded(true);
        await refreshCartCount();
        setTimeout(() => setAdded(false), 2000);
      } else {
        alert(res.error || 'Failed to add item to cart');
      }
    } catch {
      alert('Network error while adding to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col group border border-white/5 relative">
      {/* Product Image Container */}
      <NextLink href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-slate-900">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Stock Badge */}
        <div className="absolute top-2.5 left-2.5">
          {isOutOfStock ? (
            <span className="bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <AlertCircle className="w-3 h-3" />
              Out of Stock
            </span>
          ) : product.availableStock <= 5 ? (
            <span className="bg-amber-500/90 backdrop-blur-md text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
              Only {product.availableStock} left
            </span>
          ) : (
            <span className="bg-emerald-500/80 backdrop-blur-md text-slate-950 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md">
              In Stock
            </span>
          )}
        </div>

        {/* Category Pill */}
        <div className="absolute top-2.5 right-2.5">
          <span className="bg-slate-950/70 backdrop-blur-md text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-md border border-white/10">
            {product.category?.name}
          </span>
        </div>
      </NextLink>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Vendor Tag */}
          <div className="flex items-center gap-1.5 text-xs text-brand-400 mb-1.5">
            <Store className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-medium hover:underline truncate">
              {product.vendor.storeName}
            </span>
          </div>

          {/* Title */}
          <NextLink href={`/products/${product.slug}`}>
            <h3 className="text-sm font-semibold text-slate-100 hover:text-brand-300 transition-colors line-clamp-2 leading-snug">
              {product.title}
            </h3>
          </NextLink>
        </div>

        {/* Pricing & Cart Action */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-bold text-white font-heading">
              {formatCurrency(product.priceMinor)}
            </div>
            {product.compareAtPriceMinor && product.compareAtPriceMinor > product.priceMinor && (
              <div className="text-xs text-slate-500 line-through">
                {formatCurrency(product.compareAtPriceMinor)}
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`p-2.5 rounded-xl font-medium text-xs flex items-center justify-center transition-all ${
              added
                ? 'bg-emerald-500 text-slate-950 scale-95'
                : isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500 hover:text-slate-950 hover:border-transparent active:scale-95'
            }`}
            title={isOutOfStock ? 'Product out of stock' : 'Add 1 item to cart'}
          >
            {added ? (
              <Check className="w-4 h-4 animate-in zoom-in" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
