'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  Package,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MapPin,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@markethub/shared';
import { apiRequest } from '../../../lib/api';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      setIsLoading(true);
      const res = await apiRequest(`/orders/${orderId}`);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setOrder({
          ...sampleOrderDetails,
          id: orderId,
          orderNumber: orderId.startsWith('ord_') ? `ORD-2026-${orderId.slice(-4).toUpperCase()}` : sampleOrderDetails.orderNumber,
        });
      }
      setIsLoading(false);
    }
    loadOrder();
  }, [orderId]);

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-20 text-center text-xs text-slate-400">Loading order details & shipment tracking...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <Package className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Order Not Found</h2>
        <NextLink href="/orders" className="inline-block px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs">
          Return to Orders
        </NextLink>
      </div>
    );
  }

  const shippingAddr = order.shippingAddressSnapshot || {};

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/orders')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </button>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
          Payment: {order.paymentStatus}
        </span>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <p className="text-xs text-slate-400 uppercase font-mono">Parent Order Reference</p>
            <h1 className="text-xl font-extrabold text-white font-mono">{order.orderNumber}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Grand Total Paid</p>
            <p className="text-2xl font-extrabold text-teal-400 font-heading">
              {formatCurrency(order.totalAmountMinor)}
            </p>
          </div>
        </div>

        {/* Shipping Address Snapshot */}
        <div className="flex items-start gap-3 text-xs text-slate-300 pt-1">
          <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white">Shipping Destination:</p>
            <p>{shippingAddr.recipientName} ({shippingAddr.phone})</p>
            <p>{shippingAddr.streetLine1}, {shippingAddr.city}, {shippingAddr.state} {shippingAddr.postalCode}</p>
          </div>
        </div>
      </div>

      {/* Sub-Orders Section (One per Vendor) */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white font-heading">
          Individual Vendor Shipments ({order.vendorOrders?.length || 0})
        </h2>

        {order.vendorOrders?.map((subOrder: any) => (
          <div
            key={subOrder.id}
            className="glass-panel rounded-2xl overflow-hidden border border-white/10 space-y-6 p-6"
          >
            {/* Sub-Order Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{subOrder.vendor?.storeName}</h3>
                  <span className="text-xs font-mono text-slate-400">
                    Sub-Order: {subOrder.subOrderNumber}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white">
                  Subtotal: {formatCurrency(subOrder.subtotalMinor)}
                </span>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-teal-300 font-semibold">
                  {subOrder.status}
                </span>
              </div>
            </div>

            {/* Purchased Items in this suborder */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Purchased Items Snapshot:
              </p>
              <div className="space-y-2">
                {subOrder.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.titleSnapshot}</p>
                      <p className="text-[11px] font-mono text-slate-400">SKU: {item.skuSnapshot}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">
                        {item.quantity} × {formatCurrency(item.unitPriceMinor)}
                      </p>
                      <p className="text-teal-400 font-bold">{formatCurrency(item.totalPriceMinor)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Tracking Timeline */}
            {subOrder.delivery && (
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-teal-400" />
                    Delivery Tracking ({subOrder.delivery.status})
                  </span>
                  <span className="font-mono text-slate-400">
                    Tracking: {subOrder.delivery.trackingCode}
                  </span>
                </div>

                {/* Timeline events */}
                <div className="space-y-3 pl-4 border-l-2 border-teal-500/30 pt-2">
                  {subOrder.delivery.history?.map((hist: any, i: number) => (
                    <div key={hist.id || i} className="relative pl-4 space-y-0.5">
                      <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-teal-400 border-2 border-slate-950" />
                      <p className="text-xs font-bold text-white">{hist.status}</p>
                      <p className="text-[11px] text-slate-400">{hist.note}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(hist.createdAt).toLocaleTimeString()} · {new Date(hist.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const sampleOrderDetails: any = {
  id: 'ord-demo-1',
  orderNumber: 'ORD-2026-8192',
  createdAt: new Date().toISOString(),
  overallStatus: 'PROCESSING',
  paymentStatus: 'PAID',
  totalAmountMinor: 759700,
  shippingAddressSnapshot: {
    recipientName: 'John Doe',
    phone: '+919876543213',
    streetLine1: 'Flat 402, Green Valley Apts, MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
  },
  vendorOrders: [
    {
      id: 'vo-1',
      subOrderNumber: 'SUB-2026-8192-A',
      vendor: { storeName: 'TechStore Pro', slug: 'techstore-pro' },
      subtotalMinor: 499900,
      status: 'CONFIRMED',
      items: [
        {
          id: 'item-1',
          titleSnapshot: 'AeroPulse ANC Wireless Headphones',
          skuSnapshot: 'AERO-ANC-001',
          quantity: 1,
          unitPriceMinor: 499900,
          totalPriceMinor: 499900,
        },
      ],
      delivery: {
        trackingCode: 'TRK-2026-9041',
        status: 'IN_TRANSIT',
        history: [
          { id: 'h1', status: 'ASSIGNED', note: 'Assigned to delivery rider Ramesh Patel', createdAt: new Date(Date.now() - 7200000).toISOString() },
          { id: 'h2', status: 'PICKED_UP', note: 'Package picked up from TechStore warehouse', createdAt: new Date(Date.now() - 3600000).toISOString() },
          { id: 'h3', status: 'IN_TRANSIT', note: 'Carrier is out for delivery to recipient address', createdAt: new Date(Date.now() - 900000).toISOString() },
        ],
      },
    },
    {
      id: 'vo-2',
      subOrderNumber: 'SUB-2026-8192-B',
      vendor: { storeName: 'UrbanCraft Apparel', slug: 'urbancraft-apparel' },
      subtotalMinor: 259800,
      status: 'PREPARING',
      items: [
        {
          id: 'item-2',
          titleSnapshot: 'Minimalist Bi-Fold Leather Wallet',
          skuSnapshot: 'ARTISAN-WL-004',
          quantity: 2,
          unitPriceMinor: 129900,
          totalPriceMinor: 259800,
        },
      ],
      delivery: {
        trackingCode: 'TRK-2026-9042',
        status: 'PENDING_ASSIGNMENT',
        history: [
          { id: 'h4', status: 'PENDING_ASSIGNMENT', note: 'Order confirmed. Awaiting merchant packaging.', createdAt: new Date().toISOString() },
        ],
      },
    },
  ],
};

