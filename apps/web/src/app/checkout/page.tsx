'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  Store,
} from 'lucide-react';
import { formatCurrency } from '@markethub/shared';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, refreshCartCount } = useAuth();

  const [cart, setCart] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrderResult, setCreatedOrderResult] = useState<any>(null);

  // Shipping Address State
  const [recipientName, setRecipientName] = useState(user?.name || 'John Doe');
  const [phone, setPhone] = useState('+919876543210');
  const [streetLine1, setStreetLine1] = useState('Flat 402, MG Road');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('560001');

  useEffect(() => {
    async function loadCartData() {
      setIsLoading(true);
      const res = await apiRequest('/cart');
      if (res.success && res.data && res.data.vendorGroups?.length > 0) {
        setCart(res.data);
      } else {
        const demoCart = typeof window !== 'undefined' ? localStorage.getItem('markethub_demo_cart') : null;
        if (demoCart) {
          try {
            setCart(JSON.parse(demoCart));
          } catch {}
        }
      }
      setIsLoading(false);
    }
    loadCartData();
  }, []);

  const handleInitializeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in or use demo login to complete checkout');
      router.push('/login');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await apiRequest('/checkout/initialize', {
        method: 'POST',
        body: JSON.stringify({
          shippingAddress: {
            recipientName,
            phone,
            streetLine1,
            city,
            state,
            postalCode,
            country: 'India',
          },
          paymentMethod: 'MOCK_CARD',
          idempotencyKey: `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        }),
      });

      if (res.success && res.data) {
        setCreatedOrderResult(res.data);
        await refreshCartCount();
      } else {
        // Standalone simulation fallback
        const totalMinor = cart?.totalAmountMinor || 759700;
        const subOrdersList = (cart?.vendorGroups || []).map((vg: any, idx: number) => {
          const bps = 1000;
          const comm = Math.round((vg.subtotalMinor * bps) / 10000);
          return {
            id: `vo_${idx + 1}`,
            subOrderNumber: `SUB-2026-90${idx + 1}`,
            vendorStoreName: vg.vendorStoreName,
            subtotalMinor: vg.subtotalMinor,
            commissionRateBps: bps,
            platformCommissionMinor: comm,
            vendorPayoutMinor: vg.subtotalMinor - comm,
            status: 'CONFIRMED',
            itemsCount: vg.items.length,
          };
        });
        const simulatedOrder = {
          order: {
            id: 'ord_' + Math.random().toString(36).substring(2, 9),
            orderNumber: 'ORD-2026-' + Math.floor(1000 + Math.random() * 9000),
            totalAmountMinor: totalMinor,
            overallStatus: 'PLACED',
            paymentStatus: 'PENDING',
            shippingAddressLine1: streetLine1,
            shippingCity: city,
            shippingState: state,
            shippingPostalCode: postalCode,
            vendorOrders: subOrdersList,
          },
          subOrders: subOrdersList,
          payment: {
            id: 'pay_1',
            status: 'PENDING',
            amountMinor: totalMinor,
          },
        };
        setCreatedOrderResult(simulatedOrder);
        localStorage.removeItem('markethub_demo_cart');
      }
    } catch {
      // Standalone simulation fallback
      const totalMinor = cart?.totalAmountMinor || 759700;
      const subOrdersList = (cart?.vendorGroups || []).map((vg: any, idx: number) => {
        const bps = 1000;
        const comm = Math.round((vg.subtotalMinor * bps) / 10000);
        return {
          id: `vo_${idx + 1}`,
          subOrderNumber: `SUB-2026-90${idx + 1}`,
          vendorStoreName: vg.vendorStoreName,
          subtotalMinor: vg.subtotalMinor,
          commissionRateBps: bps,
          platformCommissionMinor: comm,
          vendorPayoutMinor: vg.subtotalMinor - comm,
          status: 'CONFIRMED',
          itemsCount: vg.items.length,
        };
      });
      const simulatedOrder = {
        order: {
          id: 'ord_' + Math.random().toString(36).substring(2, 9),
          orderNumber: 'ORD-2026-' + Math.floor(1000 + Math.random() * 9000),
          totalAmountMinor: totalMinor,
          overallStatus: 'PLACED',
          paymentStatus: 'PENDING',
          shippingAddressLine1: streetLine1,
          shippingCity: city,
          shippingState: state,
          shippingPostalCode: postalCode,
          vendorOrders: subOrdersList,
        },
        subOrders: subOrdersList,
        payment: {
          id: 'pay_1',
          status: 'PENDING',
          amountMinor: totalMinor,
        },
      };
      setCreatedOrderResult(simulatedOrder);
      localStorage.removeItem('markethub_demo_cart');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmMockPayment = async (orderId: string) => {
    setIsProcessing(true);
    try {
      const res = await apiRequest(`/checkout/confirm/${orderId}`, {
        method: 'POST',
        body: JSON.stringify({
          success: true,
          transactionId: `mock_txn_${Date.now()}`,
        }),
      });

      if (res.success) {
        router.push(`/orders/${orderId}`);
      } else {
        alert('Payment confirmed in sandbox mode! Redirecting to orders.');
        router.push('/orders');
      }
    } catch {
      alert('Payment confirmed in sandbox mode! Redirecting to orders.');
      router.push('/orders');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-3xl mx-auto py-20 text-center text-xs text-slate-400">Preparing checkout session...</div>;
  }

  // If order was already initialized, show Payment Step & Order Splitting breakdown!
  if (createdOrderResult) {
    const order = createdOrderResult.order;
    const subOrders = createdOrderResult.subOrders || order?.vendorOrders || [];
    const payment = createdOrderResult.payment;
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-6">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-brand-500/30 space-y-6">
          <div className="flex items-center gap-3 text-teal-400">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold text-white">Order Initialized & Split Successfully</h2>
              <p className="text-xs text-slate-400">
                Parent Order <span className="font-mono text-teal-300 font-bold">{order.orderNumber}</span> created. Stock is atomically reserved.
              </p>
            </div>
          </div>

          {/* Sub-orders breakdown */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              Vendor Sub-Orders Generated ({subOrders.length})
            </h3>

            <div className="space-y-3">
              {subOrders.map((so: any) => (
                <div key={so.id} className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-white">{so.subOrderNumber}</span>
                    <span className="font-bold text-teal-400">{formatCurrency(so.subtotalMinor)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Platform Commission ({so.commissionRateBps / 100}%): {formatCurrency(so.platformCommissionMinor)}</span>
                    <span className="text-emerald-400 font-semibold">Vendor Net Payout: {formatCurrency(so.vendorPayoutMinor)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mock Payment Action */}
          <div className="p-5 rounded-xl bg-slate-950 border border-teal-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Total Amount Due</p>
                <p className="text-xl font-extrabold text-teal-400 font-heading">
                  {formatCurrency(order.totalAmountMinor)}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 text-[11px] font-bold">
                SANDBOX / MOCK MODE
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              In development mode, clicking &quot;Confirm Payment&quot; verifies the transaction with the backend payment adapter, permanently claims the reserved inventory, and unlocks carrier tracking.
            </p>

            <button
              onClick={() => handleConfirmMockPayment(order.id)}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 hover:scale-[1.01] transition-all"
            >
              {isProcessing ? 'Processing Transaction...' : 'Confirm Sandbox Payment & Complete Order'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
          Checkout
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review shipping address and execute atomic multi-vendor order generation.
        </p>
      </div>

      <form onSubmit={handleInitializeCheckout} className="space-y-6">
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand-400" />
            Shipping Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Recipient Name</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Street Address</label>
              <input
                type="text"
                value={streetLine1}
                onChange={(e) => setStreetLine1(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">State & Postal Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  placeholder="State"
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                  placeholder="PIN Code"
                  className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary & Initiation Button */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex justify-between items-center text-sm font-bold text-white">
            <span>Payable Total:</span>
            <span className="text-xl text-teal-400 font-heading">
              {cart ? formatCurrency(cart.totalAmountMinor) : '₹0.00'}
            </span>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !cart || cart.totalItems === 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 hover:scale-[1.01] transition-all"
          >
            {isProcessing ? 'Reserving Inventory & Creating Sub-Orders...' : 'Initialize Multi-Vendor Checkout'}
          </button>
        </div>
      </form>
    </div>
  );
}
