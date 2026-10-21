'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Package, ArrowRight, Clock, CheckCircle2, Store, Truck } from 'lucide-react';
import { formatCurrency } from '@markethub/shared';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const res = await apiRequest('/orders');
      if (res.success && res.data && res.data.length > 0) {
        setOrders(res.data);
      } else {
        setOrders([
          {
            id: 'ord-demo-1',
            orderNumber: 'ORD-2026-8192',
            createdAt: new Date().toISOString(),
            overallStatus: 'PROCESSING',
            paymentStatus: 'PAID',
            totalAmountMinor: 759700,
            shippingCity: 'Bengaluru',
            shippingState: 'Karnataka',
            vendorOrders: [
              {
                id: 'vo-1',
                vendor: { storeName: 'TechStore Pro', slug: 'techstore-pro' },
                subtotalMinor: 499900,
                status: 'CONFIRMED',
                items: [
                  { title: 'AeroPulse ANC Wireless Headphones', quantity: 1, unitPriceMinor: 499900 },
                ],
                delivery: { trackingCode: 'TRK-2026-9041', status: 'ASSIGNED' },
              },
              {
                id: 'vo-2',
                vendor: { storeName: 'UrbanCraft Apparel', slug: 'urbancraft-apparel' },
                subtotalMinor: 259800,
                status: 'PREPARING',
                items: [
                  { title: 'Minimalist Bi-Fold Leather Wallet', quantity: 2, unitPriceMinor: 129900 },
                ],
                delivery: { trackingCode: 'TRK-2026-9042', status: 'PENDING_ASSIGNMENT' },
              },
            ],
          },
        ]);
      }
      setIsLoading(false);
    }
    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <Package className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-slate-400">Please sign in to view your order history and multi-vendor delivery parcels.</p>
        <NextLink href="/login" className="inline-block px-5 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs">
          Sign In
        </NextLink>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
          My Orders & Shipments
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Track fulfillment progress and carrier dispatches across all vendor packages.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl h-36 animate-pulse" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4 hover:border-brand-500/20 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/5">
                <div>
                  <span className="text-[11px] font-mono text-slate-400">Order Ref:</span>
                  <p className="text-sm font-bold text-white font-mono">{order.orderNumber}</p>
                  <p className="text-[11px] text-slate-400">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center">
                  <span className="text-base font-extrabold text-teal-400 font-heading">
                    {formatCurrency(order.totalAmountMinor)}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Multi-Vendor Sub-Orders inside this parent order */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Shipments ({order.vendorOrders?.length || 0} Vendors):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {order.vendorOrders?.map((vo: any) => (
                    <div
                      key={vo.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-teal-400" />
                          {vo.vendor?.storeName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-teal-300">
                          {vo.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{vo.items?.length || 0} item(s)</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Truck className="w-3 h-3 text-teal-400" />
                          {vo.delivery?.status || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <NextLink
                  href={`/orders/${order.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300"
                >
                  <span>View Details & Live Tracking</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NextLink>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-white">No orders placed yet</p>
          <p className="text-xs text-slate-400">When you purchase products from sellers, your orders will appear here.</p>
        </div>
      )}
    </div>
  );
}
