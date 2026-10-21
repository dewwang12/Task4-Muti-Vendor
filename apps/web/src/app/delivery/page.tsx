'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Bike, Package, Truck, CheckCircle2, MapPin, ArrowRight, Clock } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function DeliveryPortalPage() {
  const { user } = useAuth();
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadDeliveries = async () => {
    setIsLoading(true);
    const [myRes, availRes] = await Promise.all([
      apiRequest('/delivery/my-jobs'),
      apiRequest('/delivery/available'),
    ]);

    if (myRes.success && myRes.data) {
      setActiveJobs(myRes.data);
    } else {
      setActiveJobs([
        {
          id: 'del-demo-1',
          trackingCode: 'TRK-2026-9041',
          status: 'ASSIGNED',
          recipientName: 'John Doe',
          recipientPhone: '+919876543213',
          deliveryAddress: 'Flat 402, Green Valley Apts, MG Road, Bengaluru, Karnataka - 560001',
          vendorOrder: {
            vendor: { storeName: 'TechStore Pro' },
            items: [
              { title: 'AeroPulse ANC Wireless Headphones', quantity: 1, unitPriceMinor: 499900 },
            ],
          },
        },
      ]);
    }

    if (availRes.success && availRes.data) {
      setAvailableJobs(availRes.data);
    } else {
      setAvailableJobs([
        {
          id: 'del-demo-2',
          trackingCode: 'TRK-2026-9042',
          status: 'PENDING_ASSIGNMENT',
          recipientName: 'Ananya Roy',
          recipientPhone: '+919876543219',
          deliveryAddress: 'House 14, 12th Main, Indiranagar, Bengaluru - 560038',
          vendorOrder: {
            vendor: { storeName: 'FashionHub Trends' },
          },
        },
      ]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const handleClaim = async (deliveryId: string) => {
    setUpdatingId(deliveryId);
    const res = await apiRequest(`/delivery/${deliveryId}/claim`, { method: 'POST' });
    if (res.success) {
      await loadDeliveries();
    } else {
      alert(res.error || 'Failed to claim delivery');
    }
    setUpdatingId(null);
  };

  const handleStatusTransition = async (deliveryId: string, nextStatus: string) => {
    setUpdatingId(deliveryId);
    const res = await apiRequest(`/delivery/${deliveryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: nextStatus,
        note: `Updated by rider ${user?.name || ''}`,
      }),
    });

    if (res.success) {
      await loadDeliveries();
    } else {
      alert(res.error || 'Failed to advance delivery status');
    }
    setUpdatingId(null);
  };

  if (!user || user.role !== 'DELIVERY_PARTNER') {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <Bike className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Delivery Partner Sign In</h2>
        <p className="text-xs text-slate-400">Please sign in with a registered rider account to view active dispatches.</p>
        <NextLink href="/login" className="inline-block px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">
          Sign In as Rider
        </NextLink>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/20 bg-gradient-to-r from-slate-900 to-amber-950/30 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400">
            <Bike className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Rider Dispatch Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            {user.name}
          </h1>
          <p className="text-xs text-slate-400">
            Assigned Vehicle: <span className="font-semibold text-white">EV Scooter / Bike</span> · Status:{' '}
            <span className="text-emerald-400 font-bold">ACTIVE DISPATCH</span>
          </p>
        </div>
      </div>

      {/* Available Dispatches (Ready to Claim) */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-400" />
          Available Deliveries ({availableJobs.length})
        </h2>

        {availableJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableJobs.map((job) => (
              <div key={job.id} className="glass-panel rounded-2xl p-5 border border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-amber-300 font-bold">{job.trackingCode}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Awaiting Rider
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <p><span className="text-slate-400">Pickup Store:</span> {job.vendorOrder?.vendor?.storeName}</p>
                  <p><span className="text-slate-400">Destination:</span> {job.deliveryAddress}</p>
                  <p><span className="text-slate-400">Customer:</span> {job.recipientName} ({job.recipientPhone})</p>
                </div>
                <button
                  onClick={() => handleClaim(job.id)}
                  disabled={updatingId === job.id}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                >
                  {updatingId === job.id ? 'Claiming...' : 'Claim Delivery Assignment'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-xl p-6 text-center text-xs text-slate-500">
            No unassigned deliveries currently waiting for rider pickup.
          </div>
        )}
      </div>

      {/* Active Assigned Deliveries */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Truck className="w-4 h-4 text-teal-400" />
          My Active Dispatches ({activeJobs.length})
        </h2>

        {activeJobs.length > 0 ? (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <div key={job.id} className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                  <div>
                    <span className="font-mono text-xs text-teal-400 font-bold">{job.trackingCode}</span>
                    <p className="text-xs text-slate-300 font-semibold">{job.vendorOrder?.vendor?.storeName}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {job.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white">Deliver to: {job.recipientName}</p>
                      <p className="text-slate-400">{job.deliveryAddress}</p>
                      <p className="text-slate-400">Phone: {job.recipientPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Status Advancement Actions */}
                <div className="pt-2 flex flex-wrap gap-2 border-t border-white/5">
                  {job.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleStatusTransition(job.id, 'PICKED_UP')}
                      disabled={updatingId === job.id}
                      className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors"
                    >
                      {updatingId === job.id ? 'Updating...' : 'Mark as Picked Up from Store'}
                    </button>
                  )}

                  {job.status === 'PICKED_UP' && (
                    <button
                      onClick={() => handleStatusTransition(job.id, 'IN_TRANSIT')}
                      disabled={updatingId === job.id}
                      className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors"
                    >
                      {updatingId === job.id ? 'Updating...' : 'Start Transit to Customer'}
                    </button>
                  )}

                  {job.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => handleStatusTransition(job.id, 'OUT_FOR_DELIVERY')}
                      disabled={updatingId === job.id}
                      className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors"
                    >
                      {updatingId === job.id ? 'Updating...' : 'Out for Delivery (Near Location)'}
                    </button>
                  )}

                  {job.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => handleStatusTransition(job.id, 'DELIVERED')}
                      disabled={updatingId === job.id}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
                    >
                      {updatingId === job.id ? 'Updating...' : 'Confirm Delivery Completed (Handed Over)'}
                    </button>
                  )}

                  {job.status === 'DELIVERED' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Package successfully delivered</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-xl p-8 text-center text-xs text-slate-400">
            You do not have any active shipments assigned. Claim one above to start delivery.
          </div>
        )}
      </div>
    </div>
  );
}
