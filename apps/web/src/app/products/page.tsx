'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { apiRequest } from '../../lib/api';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<any>({ page: 1, limit: 12, total: 0, totalPages: 1 });

  const query = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedSort = searchParams.get('sort') || 'newest';

  const [searchTerm, setSearchTerm] = useState(query);

  const fetchProducts = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSort) params.set('sort', selectedSort);
    params.set('limit', '12');

    try {
      const [prodRes, catRes] = await Promise.all([
        apiRequest(`/products?${params.toString()}`),
        apiRequest('/categories'),
      ]);

      if (prodRes.success && prodRes.data && prodRes.data.items?.length > 0) {
        setProducts(prodRes.data.items);
        setMeta(prodRes.data.meta || {});
      } else {
        setProducts(fallbackCatalogProducts);
        setMeta({ page: 1, limit: 12, total: fallbackCatalogProducts.length, totalPages: 1 });
      }
      if (catRes.success && catRes.data && catRes.data.length > 0) {
        setCategories(catRes.data);
      } else {
        setCategories(fallbackCatalogCategories);
      }
    } catch {
      setProducts(fallbackCatalogProducts);
      setCategories(fallbackCatalogCategories);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [query, selectedCategory, selectedSort]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('q', searchTerm);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            Marketplace Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse products across verified multi-vendor stores
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter products..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </form>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-brand-400" />
                Categories
              </span>
              {selectedCategory && (
                <button
                  onClick={() => updateFilter('category', '')}
                  className="text-[10px] text-brand-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <button
                onClick={() => updateFilter('category', '')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                  !selectedCategory
                    ? 'bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                All Departments
              </button>

              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => updateFilter('category', cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                    selectedCategory === cat.slug
                      ? 'bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {cat._count?.products !== undefined && (
                    <span className="text-[10px] text-slate-500">{cat._count.products}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl h-80 animate-pulse bg-slate-900/60" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center border border-white/5 space-y-3">
              <SlidersHorizontal className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-white">No products found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No items match your active filters. Try clearing your search or browsing another category.
              </p>
              <button
                onClick={() => router.push('/products')}
                className="mt-2 px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <React.Suspense fallback={<div className="max-w-7xl mx-auto py-12 text-center text-slate-400 text-xs">Loading marketplace catalog...</div>}>
      <ProductsContent />
    </React.Suspense>
  );
}

const fallbackCatalogCategories = [
  { id: 'cat-1', name: 'Electronics & Audio', slug: 'electronics-audio' },
  { id: 'cat-2', name: 'Fashion & Bags', slug: 'fashion-bags' },
  { id: 'cat-3', name: 'Home & Living', slug: 'home-living' },
];

const fallbackCatalogProducts = [
  {
    id: 'prod-fallback-1',
    title: 'AeroPulse ANC Wireless Headphones',
    slug: 'aeropulse-anc-wireless-headphones',
    description: 'Industry-leading 40dB Hybrid Active Noise Cancellation with 50-hour battery life.',
    priceMinor: 499900,
    compareAtPriceMinor: 699900,
    sku: 'AERO-ANC-001',
    availableStock: 25,
    vendor: { id: 'ven-1', storeName: 'TechStore Pro', slug: 'techstore-pro' },
    category: { name: 'Electronics & Audio', slug: 'electronics-audio' },
    images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', altText: 'Headphones' }],
    reviewsCount: 24,
  },
  {
    id: 'prod-fallback-2',
    title: 'ApexGlide Wireless Mechanical Keyboard',
    slug: 'apexglide-wireless-mechanical-keyboard',
    description: 'Hot-swappable switches, PBT dye-sub keycaps, and ultra-low 2.4GHz latency.',
    priceMinor: 649900,
    compareAtPriceMinor: 899900,
    sku: 'APEX-KB-002',
    availableStock: 14,
    vendor: { id: 'ven-1', storeName: 'TechStore Pro', slug: 'techstore-pro' },
    category: { name: 'Electronics & Audio', slug: 'electronics-audio' },
    images: [{ url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', altText: 'Keyboard' }],
    reviewsCount: 19,
  },
  {
    id: 'prod-fallback-3',
    title: 'Artisan Voyager Full-Grain Leather Backpack',
    slug: 'artisan-voyager-leather-backpack',
    description: 'Vegetable-tanned premium leather backpack with dedicated 16-inch padded laptop sleeve.',
    priceMinor: 389900,
    compareAtPriceMinor: 549900,
    sku: 'ARTISAN-BP-003',
    availableStock: 8,
    vendor: { id: 'ven-2', storeName: 'UrbanCraft Apparel', slug: 'urbancraft-apparel' },
    category: { name: 'Fashion & Bags', slug: 'fashion-bags' },
    images: [{ url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', altText: 'Leather Backpack' }],
    reviewsCount: 31,
  },
  {
    id: 'prod-fallback-4',
    title: 'Minimalist Bi-Fold Leather Wallet',
    slug: 'minimalist-bifold-leather-wallet',
    description: 'Slimline RFID-blocking genuine top-grain leather wallet with quick card access.',
    priceMinor: 129900,
    compareAtPriceMinor: 199900,
    sku: 'ARTISAN-WL-004',
    availableStock: 30,
    vendor: { id: 'ven-2', storeName: 'UrbanCraft Apparel', slug: 'urbancraft-apparel' },
    category: { name: 'Fashion & Bags', slug: 'fashion-bags' },
    images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800', altText: 'Wallet' }],
    reviewsCount: 12,
  },
];

