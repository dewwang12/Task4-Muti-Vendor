'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Package, Plus, ArrowLeft, AlertCircle, Check, Store } from 'lucide-react';
import { formatCurrency, toMinorUnits } from '@markethub/shared';
import { apiRequest } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function VendorProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Product Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceMajor, setPriceMajor] = useState(1999);
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [initialStock, setInitialStock] = useState(20);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadVendorProducts = async () => {
    setIsLoading(true);
    const [prodRes, catRes] = await Promise.all([
      apiRequest('/vendors/products'),
      apiRequest('/categories'),
    ]);

    if (prodRes.success && prodRes.data && prodRes.data.length > 0) {
      setProducts(prodRes.data);
    } else {
      setProducts([
        {
          id: 'vp-1',
          title: 'AeroPulse ANC Wireless Headphones',
          sku: 'AERO-ANC-001',
          priceMinor: 499900,
          status: 'ACTIVE',
          category: { name: 'Electronics & Audio' },
          inventory: { quantity: 25, reservedQuantity: 0, lowStockThreshold: 5 },
          images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' }],
        },
        {
          id: 'vp-2',
          title: 'ApexGlide Wireless Mechanical Keyboard',
          sku: 'APEX-KB-002',
          priceMinor: 649900,
          status: 'ACTIVE',
          category: { name: 'Electronics & Audio' },
          inventory: { quantity: 14, reservedQuantity: 0, lowStockThreshold: 5 },
          images: [{ url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800' }],
        },
      ]);
    }
    if (catRes.success && catRes.data && catRes.data.length > 0) {
      setCategories(catRes.data);
      setCategoryId(catRes.data[0].id);
    } else {
      setCategories([
        { id: 'cat-1', name: 'Electronics & Audio' },
        { id: 'cat-2', name: 'Fashion & Bags' },
        { id: 'cat-3', name: 'Home & Living' },
      ]);
      setCategoryId('cat-1');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadVendorProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const priceMinor = toMinorUnits(priceMajor);
    const res = await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        priceMinor,
        sku,
        categoryId,
        initialStock: Number(initialStock),
        imageUrls: imageUrl ? [imageUrl] : [],
      }),
    });

    if (res.success) {
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setSku('');
      setImageUrl('');
      await loadVendorProducts();
    } else {
      alert(res.error || 'Failed to create product');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <NextLink href="/vendor" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </NextLink>
          <h1 className="text-2xl font-bold text-white font-heading">Store Products & Inventory</h1>
          <p className="text-xs text-slate-400">Manage your product catalog, SKUs, and stock quantities.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 hover:bg-teal-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 divide-y divide-white/5">
          <div className="px-6 py-3 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 grid grid-cols-12 gap-4">
            <span className="col-span-6">Product</span>
            <span className="col-span-2">SKU</span>
            <span className="col-span-2 text-right">Price</span>
            <span className="col-span-2 text-right">Stock Level</span>
          </div>

          {products.map((p) => {
            const available = (p.inventory?.quantity || 0) - (p.inventory?.reservedQuantity || 0);
            return (
              <div key={p.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center text-xs">
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-600 m-auto mt-3" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{p.title}</p>
                    <p className="text-[11px] text-slate-400">{p.category?.name}</p>
                  </div>
                </div>

                <span className="col-span-2 font-mono text-slate-300">{p.sku}</span>

                <span className="col-span-2 text-right font-bold text-white">
                  {formatCurrency(p.priceMinor)}
                </span>

                <div className="col-span-2 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                      available <= 5
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {available} available
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-white">No products listed yet</p>
          <p className="text-xs text-slate-400">Click &quot;Add New Product&quot; above to list your first item.</p>
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-lg w-full p-6 border border-white/10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h2 className="text-base font-bold text-white font-heading">Add New Product to Store</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Product Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Ergonomic Bluetooth Mouse"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Detailed specifications and features..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={priceMajor}
                    onChange={(e) => setPriceMajor(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Unique SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    placeholder="e.g. MOU-WIR-001"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Department</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Initial Physical Stock</label>
                  <input
                    type="number"
                    value={initialStock}
                    onChange={(e) => setInitialStock(Number(e.target.value))}
                    required
                    min={0}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors"
                >
                  {isSubmitting ? 'Creating Product...' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
