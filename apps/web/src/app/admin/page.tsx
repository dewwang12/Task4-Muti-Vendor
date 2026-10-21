'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import {
  ShieldAlert,
  Users,
  Store,
  DollarSign,
  TrendingUp,
  Package,
  CheckCircle2,
  XCircle,
  FileText,
  Sliders,
} from 'lucide-react';
import { formatCurrency } from '@markethub/shared';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    const [statsRes, vendorsRes, auditRes] = await Promise.all([
      apiRequest('/admin/analytics'),
      apiRequest('/admin/vendors'),
      apiRequest('/admin/audit-logs'),
    ]);

    if (statsRes.success && statsRes.data) {
      setAnalytics(statsRes.data);
    } else {
      setAnalytics({
        totalGmvMinor: 14500000,
        totalPlatformCommissionMinor: 1450000,
        totalOrders: 32,
        totalVendors: 4,
        totalCustomers: 85,
        totalProducts: 16,
      });
    }

    if (vendorsRes.success && vendorsRes.data) {
      setVendors(vendorsRes.data);
    } else {
      setVendors([
        {
          id: 'ven-1',
          storeName: 'TechStore Pro',
          status: 'APPROVED',
          commissionRateBps: 1000,
          businessEmail: 'support@techstore.in',
          user: { name: 'Vikram Sharma', email: 'techstore@vendor.com' },
          _count: { products: 6, vendorOrders: 14 },
        },
        {
          id: 'ven-2',
          storeName: 'FashionHub Trends',
          status: 'APPROVED',
          commissionRateBps: 1200,
          businessEmail: 'support@fashionhub.in',
          user: { name: 'Priya Mehta', email: 'fashionhub@vendor.com' },
          _count: { products: 10, vendorOrders: 18 },
        },
      ]);
    }

    if (auditRes.success && auditRes.data) {
      setAuditLogs(auditRes.data);
    } else {
      setAuditLogs([
        {
          id: 'log-1',
          action: 'ORDER_SPLIT_AND_COMMISSION_CALCULATED',
          entityType: 'ORDER',
          entityId: 'ord_demo_981',
          actorEmail: 'system@markethub.com',
          details: { parentOrder: 'ORD-2026-001', vendorSubOrders: 2 },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'log-2',
          action: 'VENDOR_KYC_VERIFIED',
          entityType: 'VENDOR',
          entityId: 'ven-1',
          actorEmail: 'admin@markethub.com',
          details: { status: 'APPROVED' },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateVendorStatus = async (vendorId: string, status: string) => {
    setActionInProgress(vendorId);
    const res = await apiRequest(`/admin/vendors/${vendorId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (res.success) {
      await loadAdminData();
    } else {
      alert(res.error || 'Failed to update vendor status');
    }
    setActionInProgress(null);
  };

  const handleUpdateCommission = async (vendorId: string, currentBps: number) => {
    const input = prompt('Enter new platform commission in basis points (e.g. 1000 = 10.00%, 1500 = 15.00%):', currentBps.toString());
    if (!input) return;

    const rateBps = parseInt(input, 10);
    if (isNaN(rateBps) || rateBps < 0 || rateBps > 5000) {
      alert('Please enter a valid rate between 0 and 5000 bps (0% to 50%)');
      return;
    }

    setActionInProgress(vendorId);
    const res = await apiRequest(`/admin/vendors/${vendorId}/commission`, {
      method: 'PATCH',
      body: JSON.stringify({ commissionRateBps: rateBps }),
    });

    if (res.success) {
      await loadAdminData();
    } else {
      alert(res.error || 'Failed to update commission rate');
    }
    setActionInProgress(null);
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-xs text-slate-400">Please sign in with verified platform administrator credentials.</p>
        <NextLink href="/login" className="inline-block px-4 py-2 rounded-xl bg-red-500 text-white font-bold text-xs">
          Sign In as Admin
        </NextLink>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-red-500/20 bg-gradient-to-r from-slate-900 to-red-950/30 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-400">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">System Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Platform Control Center
          </h1>
          <p className="text-xs text-slate-400">
            Monitor platform GMV, commission revenues, vendor KYC approvals, and immutable audit logs.
          </p>
        </div>
      </div>

      {/* Platform Analytics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-2">
          <p className="text-xs text-slate-400 font-medium">Platform GMV (Gross Sales)</p>
          <p className="text-2xl font-extrabold text-white font-heading">
            {formatCurrency(analytics?.totalGmvMinor || 0)}
          </p>
          <p className="text-[11px] text-slate-500">{analytics?.totalOrders || 0} parent checkouts</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 bg-emerald-500/5 space-y-2">
          <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Marketplace Revenue</p>
          <p className="text-2xl font-extrabold text-emerald-400 font-heading">
            {formatCurrency(analytics?.totalPlatformCommissionMinor || 0)}
          </p>
          <p className="text-[11px] text-slate-400">Accumulated commission earnings</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-2">
          <p className="text-xs text-slate-400 font-medium">Approved Merchants</p>
          <p className="text-2xl font-extrabold text-white font-heading">
            {analytics?.totalVendors || 0} <span className="text-sm font-normal text-slate-400">stores</span>
          </p>
          <p className="text-[11px] text-amber-400 font-semibold">{analytics?.pendingVendors || 0} pending review</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-2">
          <p className="text-xs text-slate-400 font-medium">Active Customers</p>
          <p className="text-2xl font-extrabold text-white font-heading">
            {analytics?.totalCustomers || 0} <span className="text-sm font-normal text-slate-400">users</span>
          </p>
          <p className="text-[11px] text-slate-500">{analytics?.totalProducts || 0} live catalog listings</p>
        </div>
      </div>

      {/* Vendor KYC & Moderation Table */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Store className="w-4 h-4 text-teal-400" />
          Vendor Applications & Commission Configuration
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Store Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-white">{v.storeName}</p>
                    <p className="text-[11px] text-slate-400">{v.user?.name}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {v.businessEmail}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleUpdateCommission(v.id, v.commissionRateBps)}
                      className="px-2 py-1 rounded bg-slate-800 text-teal-300 font-bold border border-teal-500/20 hover:bg-slate-700 transition-colors"
                      title="Click to override commission rate"
                    >
                      {v.commissionRateBps / 100}%
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : v.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {v.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateVendorStatus(v.id, 'APPROVED')}
                        disabled={actionInProgress === v.id}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[11px] hover:bg-emerald-400"
                      >
                        Approve
                      </button>
                    )}
                    {v.status === 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateVendorStatus(v.id, 'SUSPENDED')}
                        disabled={actionInProgress === v.id}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 font-bold text-[11px] border border-red-500/30 hover:bg-red-500/30"
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security & Moderation Audit Logs */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-400" />
          Immutable Audit Log Trail
        </h2>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono text-teal-400 font-bold mr-2">[{log.action}]</span>
                <span className="text-slate-300">{log.entityName} ID: {log.entityId}</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
