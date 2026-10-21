'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Store,
  ShieldCheck,
  Truck,
  ShoppingCart,
  Check,
  Star,
  Package,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { formatCurrency } from '@markethub/shared';
import { apiRequest } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function ProductDetailsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { user, refreshCartCount } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setIsLoading(true);
      const res = await apiRequest(`/products/${slug}`);
      if (res.success && res.data) {
        setProduct(res.data);
      } else {
        const fallback = fallbackDetailProducts[slug];
        if (fallback) setProduct(fallback);
      }
      setIsLoading(false);
    }
    loadProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product || isAdding || product.availableStock <= 0) return;
    setIsAdding(true);
    try {
      const res = await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });

      if (res.success) {
        setAdded(true);
        await refreshCartCount();
        setTimeout(() => setAdded(false), 2500);
      } else {
        alert(res.error || 'Failed to add item to cart');
      }
    } catch {
      alert('Network error while adding to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    if (!reviewComment.trim()) return;

    setIsSubmittingReview(true);
    const res = await apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        productId: product.id,
        rating: reviewRating,
        comment: reviewComment,
      }),
    });

    if (res.success) {
      alert('Review submitted successfully!');
      setReviewComment('');
      // Refresh product data
      const refreshed = await apiRequest(`/products/${slug}`);
      if (refreshed.success) setProduct(refreshed.data);
    } else {
      alert(res.error || 'Failed to submit review');
    }
    setIsSubmittingReview(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-slate-900 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 bg-slate-800 rounded w-1/3 animate-pulse" />
            <div className="h-10 bg-slate-800 rounded w-3/4 animate-pulse" />
            <div className="h-24 bg-slate-900 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <p className="text-xs text-slate-400">The product requested could not be located in our active catalog.</p>
        <NextLink href="/products" className="inline-block px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs">
          Return to Catalog
        </NextLink>
      </div>
    );
  }

  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0].url
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';

  const isOutOfStock = product.availableStock <= 0;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12 items-start">
        {/* Product Image */}
        <div className="aspect-square rounded-2xl overflow-hidden glass-card p-2 bg-slate-900/60 relative">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover object-center rounded-xl"
          />
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          {/* Category & SKU */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-brand-400">{product.category?.name}</span>
            <span className="font-mono">SKU: {product.sku}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading leading-tight">
            {product.title}
          </h1>

          {/* Pricing */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-white font-heading">
              {formatCurrency(product.priceMinor)}
            </span>
            {product.compareAtPriceMinor && product.compareAtPriceMinor > product.priceMinor && (
              <span className="text-sm text-slate-500 line-through">
                {formatCurrency(product.compareAtPriceMinor)}
              </span>
            )}
          </div>

          {/* Vendor Card */}
          <div className="glass-card rounded-xl p-4 border border-brand-500/20 bg-brand-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono">Independent Merchant</p>
                <p className="text-sm font-bold text-white">{product.vendor?.storeName}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Verified Seller
            </span>
          </div>

          {/* Description */}
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-b border-white/5 py-4">
            {product.description}
          </div>

          {/* Quantity & Cart Action */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">Quantity:</span>
              <div className="flex items-center border border-slate-700 rounded-xl bg-slate-900">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-slate-300 hover:text-white"
                  disabled={quantity <= 1 || isOutOfStock}
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-white min-w-[32px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.availableStock, quantity + 1))}
                  className="px-3 py-1.5 text-slate-300 hover:text-white"
                  disabled={quantity >= product.availableStock || isOutOfStock}
                >
                  +
                </button>
              </div>
              <span className="text-xs text-slate-400">
                {product.availableStock} available in stock
              </span>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  added
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                    : isOutOfStock
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-brand-500 to-teal-400 text-slate-950 shadow-teal-500/20 hover:scale-[1.02] active:scale-98'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : isOutOfStock ? (
                  <span>Out of Stock</span>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Shopping Cart</span>
                  </>
                )}
              </button>

              <NextLink
                href="/cart"
                className="py-3.5 px-6 rounded-xl glass-panel text-white font-bold text-sm hover:border-brand-500/40 transition-colors flex items-center justify-center"
              >
                Go to Cart
              </NextLink>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="space-y-6 pt-10 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-heading">
            Verified Customer Reviews
          </h2>
          <span className="text-xs text-slate-400">
            {product.reviews?.length || 0} reviews
          </span>
        </div>

        {/* Existing Reviews */}
        <div className="space-y-4">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((rev: any) => (
              <div key={rev.id} className="glass-panel rounded-xl p-4 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{rev.customer?.name}</span>
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-300">{rev.comment}</p>
                <div className="flex items-center gap-1 text-[10px] text-teal-400">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Purchase</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No reviews yet for this product.</p>
          )}
        </div>

        {/* Review Form */}
        {user ? (
          <form onSubmit={handleReviewSubmit} className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white">Write a Verified Review</h3>
            <p className="text-xs text-slate-400">
              Only verified customers who have completed an order for this item may publish a review.
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Rating:</span>
              <select
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1"
              >
                <option value={5}>5 Stars - Excellent</option>
                <option value={4}>4 Stars - Great</option>
                <option value={3}>3 Stars - Average</option>
                <option value={2}>2 Stars - Below Average</option>
                <option value={1}>1 Star - Poor</option>
              </select>
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this item..."
              rows={3}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />

            <button
              type="submit"
              disabled={isSubmittingReview}
              className="px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs hover:bg-brand-400 transition-colors"
            >
              {isSubmittingReview ? 'Submitting...' : 'Post Review'}
            </button>
          </form>
        ) : (
          <div className="glass-panel rounded-xl p-4 text-center text-xs text-slate-400">
            <NextLink href="/login" className="text-brand-400 font-bold hover:underline">
              Sign in
            </NextLink>{' '}
            with your customer account to leave a verified review.
          </div>
        )}
      </section>
    </div>
  );
}

const fallbackDetailProducts: Record<string, any> = {
  'aeropulse-anc-wireless-headphones': {
    id: 'prod-fallback-1',
    title: 'AeroPulse ANC Wireless Headphones',
    slug: 'aeropulse-anc-wireless-headphones',
    description: 'Industry-leading 40dB Hybrid Active Noise Cancellation with 50-hour battery life and ultra-comfortable memory foam ear cushions. Featuring dual 40mm beryllium drivers for crystalline treble and thunderous sub-bass precision.',
    priceMinor: 499900,
    compareAtPriceMinor: 699900,
    sku: 'AERO-ANC-001',
    availableStock: 25,
    vendor: { id: 'ven-1', storeName: 'TechStore Pro', slug: 'techstore-pro' },
    category: { name: 'Electronics & Audio', slug: 'electronics-audio' },
    images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', altText: 'Headphones' }],
    reviews: [
      { id: 'rev-1', rating: 5, comment: 'Phenomenal noise cancellation and build quality for the price!', authorName: 'Arjun K.', createdAt: new Date().toISOString() },
    ],
  },
  'apexglide-wireless-mechanical-keyboard': {
    id: 'prod-fallback-2',
    title: 'ApexGlide Wireless Mechanical Keyboard',
    slug: 'apexglide-wireless-mechanical-keyboard',
    description: 'Hot-swappable switches, PBT dye-sub keycaps, and ultra-low 2.4GHz latency. Sound dampening foam and pre-lubed stabilizers guarantee a satisfying acoustic profile.',
    priceMinor: 649900,
    compareAtPriceMinor: 899900,
    sku: 'APEX-KB-002',
    availableStock: 14,
    vendor: { id: 'ven-1', storeName: 'TechStore Pro', slug: 'techstore-pro' },
    category: { name: 'Electronics & Audio', slug: 'electronics-audio' },
    images: [{ url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', altText: 'Keyboard' }],
    reviews: [
      { id: 'rev-2', rating: 5, comment: 'Typing feel is incredible straight out of the box.', authorName: 'Siddharth M.', createdAt: new Date().toISOString() },
    ],
  },
  'artisan-voyager-leather-backpack': {
    id: 'prod-fallback-3',
    title: 'Artisan Voyager Full-Grain Leather Backpack',
    slug: 'artisan-voyager-leather-backpack',
    description: 'Vegetable-tanned premium leather backpack with dedicated 16-inch padded laptop sleeve, waterproof interior lining, and solid brass hardware.',
    priceMinor: 389900,
    compareAtPriceMinor: 549900,
    sku: 'ARTISAN-BP-003',
    availableStock: 8,
    vendor: { id: 'ven-2', storeName: 'UrbanCraft Apparel', slug: 'urbancraft-apparel' },
    category: { name: 'Fashion & Bags', slug: 'fashion-bags' },
    images: [{ url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', altText: 'Leather Backpack' }],
    reviews: [],
  },
  'minimalist-bifold-leather-wallet': {
    id: 'prod-fallback-4',
    title: 'Minimalist Bi-Fold Leather Wallet',
    slug: 'minimalist-bifold-leather-wallet',
    description: 'Slimline RFID-blocking genuine top-grain leather wallet with quick card access, cash compartment, and reinforced stitching.',
    priceMinor: 129900,
    compareAtPriceMinor: 199900,
    sku: 'ARTISAN-WL-004',
    availableStock: 30,
    vendor: { id: 'ven-2', storeName: 'UrbanCraft Apparel', slug: 'urbancraft-apparel' },
    category: { name: 'Fashion & Bags', slug: 'fashion-bags' },
    images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800', altText: 'Wallet' }],
    reviews: [],
  },
};

