'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  Store,
  ArrowRight,
  ShieldCheck,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@markethub/shared';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function CartPage() {
  const router = useRouter();
  const { user, refreshCartCount } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCart = async () => {
    setIsLoading(true);
    const res = await apiRequest('/cart');
    if (res.success && res.data && res.data.vendorGroups?.length > 0) {
      setCart(res.data);
    } else {
      const demoCart = typeof window !== 'undefined' ? localStorage.getItem('markethub_demo_cart') : null;
      if (demoCart) {
        try {
          setCart(JSON.parse(demoCart));
        } catch {
          setCart(null);
        }
      } else {
        setCart(res.data || null);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdateQuantity = async (cartItemId: string, newQty: number) => {
    const res = await apiRequest(`/cart/items/${cartItemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity: newQty }),
    });

    if (res.success && res.data) {
      setCart(res.data);
      await refreshCartCount();
    } else {
      alert(res.error || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    const res = await apiRequest(`/cart/items/${cartItemId}`, {
      method: 'DELETE',
    });

    if (res.success && res.data) {
      setCart(res.data);
      await refreshCartCount();
    } else {
      alert(res.error || 'Failed to remove item');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-4">
        <div className="h-8 bg-slate-900 rounded w-1/4 animate-pulse" />
        <div className="h-64 bg-slate-900 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const isEmpty = !cart || !cart.vendorGroups || cart.vendorGroups.length === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
          Multi-Vendor Shopping Cart
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Items from multiple independent sellers will be ordered together and split atomically for fulfillment.
        </p>
      </div>

      {isEmpty ? (
        <div className="glass-panel rounded-2xl p-16 text-center space-y-4 border border-white/5">
          <ShoppingBag className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Your cart is currently empty</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Discover products from our verified independent merchants and add them to your cart.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setCart(sampleMultiVendorCart);
                localStorage.setItem('markethub_demo_cart', JSON.stringify(sampleMultiVendorCart));
                refreshCartCount();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 hover:scale-105 transition-all"
            >
              <span>Load Multi-Vendor Sample Cart</span>
            </button>
            <NextLink
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card text-white font-bold text-xs hover:border-brand-500/40 transition-colors"
            >
              <span>Start Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NextLink>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Vendor Groups Container */}
          <div className="lg:col-span-2 space-y-6">
            {cart.vendorGroups.map((group: any) => (
              <div
                key={group.vendorId}
                className="glass-panel rounded-2xl overflow-hidden border border-white/10"
              >
                {/* Vendor Group Header */}
                <div className="px-5 py-3.5 bg-slate-900/80 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-teal-400">
                    <Store className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      {group.vendorStoreName}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-teal-300">
                    Subtotal: {formatCurrency(group.subtotalMinor)}
                  </span>
                </div>

                {/* Items in this Vendor Group */}
                <div className="divide-y divide-white/5">
                  {group.items.map((item: any) => (
                    <div key={item.cartItemId} className="p-4 sm:p-5 flex gap-4 items-center">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Info & Quantity */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <NextLink
                          href={`/products/${item.slug}`}
                          className="text-xs sm:text-sm font-semibold text-white hover:text-brand-300 truncate block"
                        >
                          {item.title}
                        </NextLink>
                        <p className="text-[11px] text-slate-400 font-mono">SKU: {item.sku}</p>
                        <p className="text-xs font-bold text-white">
                          {formatCurrency(item.unitPriceMinor)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-700 rounded-lg bg-slate-900 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
                          className="px-2.5 py-1 text-slate-400 hover:text-white"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                          className="px-2.5 py-1 text-slate-400 hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right shrink-0 min-w-[70px]">
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {formatCurrency(item.totalPriceMinor)}
                        </span>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleRemoveItem(item.cartItemId)}
                        className="text-slate-500 hover:text-red-400 p-1.5 transition-colors shrink-0"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Unified Order Summary */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-6 lg:sticky lg:top-24">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Total Items ({cart.totalItems})</span>
                <span className="font-medium text-white">{formatCurrency(cart.totalAmountMinor)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & Dispatch</span>
                <span className="text-teal-400 font-medium">FREE Standard</span>
              </div>
              <div className="flex justify-between">
                <span>Independent Sellers</span>
                <span className="text-white font-medium">{cart.vendorGroups.length} Stores</span>
              </div>

              <div className="border-t border-white/10 pt-3 flex justify-between text-base font-bold text-white">
                <span>Grand Total</span>
                <span className="text-teal-400">{formatCurrency(cart.totalAmountMinor)}</span>
              </div>
            </div>

            <NextLink
              href="/checkout"
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-500 to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-98 transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </NextLink>

            <div className="space-y-2 pt-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>Single secure payment across all vendors</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-400" />
                <span>Separate parcel tracking per vendor shipment</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sampleMultiVendorCart = {
  items: [
    {
      id: 'ci-1',
      productId: 'prod-fallback-1',
      quantity: 1,
      product: {
        id: 'prod-fallback-1',
        title: 'AeroPulse ANC Wireless Headphones',
        priceMinor: 499900,
        sku: 'AERO-ANC-001',
        vendor: { id: 'ven-1', storeName: 'TechStore Pro', slug: 'techstore-pro' },
        images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' }],
        inventory: { quantity: 25, reservedQuantity: 0 },
      },
    },
    {
      id: 'ci-2',
      productId: 'prod-fallback-4',
      quantity: 2,
      product: {
        id: 'prod-fallback-4',
        title: 'Minimalist Bi-Fold Leather Wallet',
        priceMinor: 129900,
        sku: 'ARTISAN-WL-004',
        vendor: { id: 'ven-2', storeName: 'UrbanCraft Apparel', slug: 'urbancraft-apparel' },
        images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800' }],
        inventory: { quantity: 30, reservedQuantity: 0 },
      },
    },
  ],
  vendorGroups: [
    {
      vendorId: 'ven-1',
      vendorStoreName: 'TechStore Pro',
      vendorSlug: 'techstore-pro',
      subtotalMinor: 499900,
      items: [
        {
          cartItemId: 'ci-1',
          productId: 'prod-fallback-1',
          title: 'AeroPulse ANC Wireless Headphones',
          sku: 'AERO-ANC-001',
          unitPriceMinor: 499900,
          quantity: 1,
          totalPriceMinor: 499900,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
          availableStock: 25,
        },
      ],
    },
    {
      vendorId: 'ven-2',
      vendorStoreName: 'UrbanCraft Apparel',
      vendorSlug: 'urbancraft-apparel',
      subtotalMinor: 259800,
      items: [
        {
          cartItemId: 'ci-2',
          productId: 'prod-fallback-4',
          title: 'Minimalist Bi-Fold Leather Wallet',
          sku: 'ARTISAN-WL-004',
          unitPriceMinor: 129900,
          quantity: 2,
          totalPriceMinor: 259800,
          imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800',
          availableStock: 30,
        },
      ],
    },
  ],
  totalAmountMinor: 759700,
  totalItems: 3,
};

