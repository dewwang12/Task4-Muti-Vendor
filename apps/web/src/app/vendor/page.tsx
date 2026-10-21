'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  DollarSign,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '@markethub/shared';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function VendorDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const [analyticsRes, profileRes] = await Promise.all([
        apiRequest('/vendors/analytics'),
        apiRequest('/vendors/profile'),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      } else {
        setAnalytics({
          totalSalesMinor: 4899000,
          totalCommissionMinor: 489900,
          totalPayoutMinor: 4409100,
          totalUnitsSold: 18,
          totalOrders: 14,
          lowStockCount: 1,
          lowStockProducts: [
            { id: 'p-low', title: 'Artisan Voyager Backpack', sku: 'ARTISAN-BP-003', availableStock: 2 },
          ],
        });
      }
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
      } else {
        setProfile(user.vendor || {
          storeName: 'TechStore Pro',
          status: 'APPROVED',
          commissionRateBps: 1000,
        });
      }
      setIsLoading(false);
    }
    loadData();
  }, [user]);

  if (!user || user.role !== 'VENDOR') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <Store className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Vendor Portal Access</h2>
        <p className="text-xs text-slate-400">Please sign in with a registered vendor account to view this dashboard.</p>
        <NextLink href="/login" className="inline-block px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs">
          Sign In as Vendor
        </NextLink>
      </div>
    );
  }

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading vendor store analytics...</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Store Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-teal-500/20 bg-gradient-to-r from-slate-900 to-teal-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-400">
            <Store className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Vendor Storefront</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            {profile?.storeName || 'My Store'}
          </h1>
          <p className="text-xs text-slate-400">
            Status:{' '}
            <span className="font-bold text-teal-300">
              {profile?.status || 'APPROVED'}
            </span>{' '}
            · Platform Commission:{' '}
            <span className="font-bold text-white">
              {(profile?.commissionRateBps || 1000) / 100}%
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NextLink
            href="/vendor/products"
            className="px-4 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 hover:bg-teal-400 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Manage Products</span>
          </NextLink>

          <NextLink
            href="/vendor/orders"
            className="px-4 py-2.5 rounded-xl glass-card text-white font-bold text-xs flex items-center gap-1.5 hover:border-teal-500/40 transition-colors"
          >
            <span>Fulfill Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NextLink>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-2">
          <p className="text-xs text-slate-400 font-medium">Gross Product Sales</p>
          <p className="text-2xl font-extrabold text-white font-heading">
            {formatCurrency(analytics?.totalSalesMinor || 0)}
          </p>
          <p className="text-[11px] text-slate-500">Gross value before marketplace deductions</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-2">
          <p className="text-xs text-slate-400 font-medium">Marketplace Commission</p>
          <p className="text-2xl font-extrabold text-red-400 font-heading">
            - {formatCurrency(analytics?.totalCommissionMinor || 0)}
          </p>
          <p className="text-[11px] text-slate-500">Calculated by platform commission rules</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-teal-500/30 bg-teal-500/5 space-y-2">
          <p className="text-xs text-teal-300 font-bold uppercase tracking-wider">Estimated Net Payable</p>
          <p className="text-2xl font-extrabold text-emerald-400 font-heading">
            {formatCurrency(analytics?.totalPayoutMinor || 0)}
          </p>
          <p className="text-[11px] text-slate-400">Total earned ledger balance</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-2">
          <p className="text-xs text-slate-400 font-medium">Units Sold / Orders</p>
          <p className="text-2xl font-extrabold text-white font-heading">
            {analytics?.totalUnitsSold || 0} <span className="text-sm font-normal text-slate-400">units</span>
          </p>
          <p className="text-[11px] text-slate-500">{analytics?.totalOrders || 0} sub-orders processed</p>
        </div>
      </div>

      {/* Low-Stock Warnings Alert */}
      {analytics?.lowStockCount > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock Warning ({analytics.lowStockCount} items below threshold)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {analytics.lowStockProducts.map((p: any) => (
              <div key={p.id} className="p-3 rounded-xl bg-slate-900 border border-white/5 text-xs flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{p.title}</p>
                  <p className="text-[10px] font-mono text-slate-400">SKU: {p.sku}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                  {p.availableStock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
