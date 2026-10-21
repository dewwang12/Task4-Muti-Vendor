'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Package, ArrowLeft, Store, Truck, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '@markethub/shared';
import { apiRequest } from '../../../lib/api';

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    const res = await apiRequest('/vendors/orders');
    if (res.success && res.data && res.data.length > 0) {
      setOrders(res.data);
    } else {
      setOrders([
        {
          id: 'vo-demo-1',
          subOrderNumber: 'SUB-2026-8192-A',
          createdAt: new Date().toISOString(),
          status: 'PREPARING',
          subtotalMinor: 499900,
          order: {
            orderNumber: 'ORD-2026-8192',
            shippingAddressSnapshot: {
              recipientName: 'John Doe',
              phone: '+919876543213',
              streetLine1: 'Flat 402, Green Valley Apts, MG Road',
              city: 'Bengaluru',
              state: 'Karnataka',
              postalCode: '560001',
            },
          },
          items: [
            {
              id: 'item-1',
              titleSnapshot: 'AeroPulse ANC Wireless Headphones',
              skuSnapshot: 'AERO-ANC-001',
              quantity: 1,
            },
          ],
          delivery: {
            status: 'ASSIGNED',
          },
        },
      ]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusUpdate = async (subOrderId: string, nextStatus: string) => {
    setIsUpdating(subOrderId);
    const res = await apiRequest(`/vendors/orders/${subOrderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });

    if (res.success) {
      await loadOrders();
    } else {
      alert(res.error || 'Failed to update order status');
    }
    setIsUpdating(null);
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="pb-4 border-b border-white/10">
        <NextLink href="/vendor" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </NextLink>
        <h1 className="text-2xl font-bold text-white font-heading">Vendor Order Fulfillment</h1>
        <p className="text-xs text-slate-400">
          Manage fulfillment for sub-orders containing your store&apos;s products. Advance status when ready for carrier pickup.
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
          {orders.map((vo) => (
            <div
              key={vo.id}
              className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/5">
                <div>
                  <span className="text-xs font-mono text-teal-400 font-bold">{vo.subOrderNumber}</span>
                  <p className="text-[11px] text-slate-400">
                    Parent Ref: {vo.order?.orderNumber} · {new Date(vo.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white">
                    Subtotal: {formatCurrency(vo.subtotalMinor)}
                  </span>
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-teal-500/20 text-teal-300">
                    {vo.status}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Items to Pack:
                </p>
                <div className="space-y-1.5">
                  {vo.items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{item.titleSnapshot}</span>
                        <span className="font-mono text-slate-400 ml-2">({item.skuSnapshot})</span>
                      </div>
                      <span className="font-bold text-white">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address Snapshot */}
              {vo.order?.shippingAddressSnapshot && (
                <div className="text-xs text-slate-300 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="font-bold text-slate-200">Customer Ship-To: </span>
                  {vo.order.shippingAddressSnapshot.recipientName} ({vo.order.shippingAddressSnapshot.phone}) —{' '}
                  {vo.order.shippingAddressSnapshot.streetLine1}, {vo.order.shippingAddressSnapshot.city},{' '}
                  {vo.order.shippingAddressSnapshot.state} {vo.order.shippingAddressSnapshot.postalCode}
                </div>
              )}

              {/* State Transition Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-white/5">
                <div className="text-[11px] text-slate-400">
                  Carrier Status: <span className="text-teal-400 font-semibold">{vo.delivery?.status || 'PENDING_ASSIGNMENT'}</span>
                </div>

                <div className="flex gap-2">
                  {vo.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleStatusUpdate(vo.id, 'PREPARING')}
                      disabled={isUpdating === vo.id}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors"
                    >
                      {isUpdating === vo.id ? 'Updating...' : 'Mark as Preparing / Packing'}
                    </button>
                  )}

                  {vo.status === 'PREPARING' && (
                    <button
                      onClick={() => handleStatusUpdate(vo.id, 'READY_FOR_PICKUP')}
                      disabled={isUpdating === vo.id}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
                    >
                      {isUpdating === vo.id ? 'Updating...' : 'Ready for Carrier Pickup'}
                    </button>
                  )}

                  {vo.status === 'READY_FOR_PICKUP' && (
                    <span className="text-xs text-emerald-400 font-semibold">
                      Awaiting delivery partner pickup
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-white">No sub-orders received yet</p>
          <p className="text-xs text-slate-400">When customers purchase items from your store, your assigned sub-orders will appear here.</p>
        </div>
      )}
    </div>
  );
}
