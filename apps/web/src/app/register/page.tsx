'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import { ShoppingBag, User, Store, Bike, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const initialRole = searchParams.get('role') || 'CUSTOMER';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [vehicleType, setVehicleType] = useState('BIKE');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const payload: any = {
      name,
      email,
      password,
      phone,
      role,
    };

    if (role === 'VENDOR') {
      payload.storeName = storeName;
      payload.storeDescription = storeDescription;
    }
    if (role === 'DELIVERY_PARTNER') {
      payload.vehicleType = vehicleType;
    }

    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.success) {
      await login(email, password);
      if (role === 'VENDOR') router.push('/vendor');
      else if (role === 'DELIVERY_PARTNER') router.push('/delivery');
      else router.push('/');
    } else {
      setError(res.error || 'Registration failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white font-heading">Create MarketHub Account</h1>
        <p className="text-xs text-slate-400">Choose your account type to get started.</p>
      </div>

      {/* Role Picker Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-white/10 text-xs">
        <button
          type="button"
          onClick={() => setRole('CUSTOMER')}
          className={`py-2 px-3 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            role === 'CUSTOMER'
              ? 'bg-brand-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Customer</span>
        </button>

        <button
          type="button"
          onClick={() => setRole('VENDOR')}
          className={`py-2 px-3 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            role === 'VENDOR'
              ? 'bg-teal-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Vendor</span>
        </button>

        <button
          type="button"
          onClick={() => setRole('DELIVERY_PARTNER')}
          className={`py-2 px-3 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            role === 'DELIVERY_PARTNER'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Rider</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        {/* Vendor-specific fields */}
        {role === 'VENDOR' && (
          <div className="pt-2 border-t border-white/5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-teal-300 mb-1">Store / Brand Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                placeholder="e.g. ApexGear Studios"
                className="w-full bg-slate-900 border border-teal-500/30 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-teal-300 mb-1">Store Description</label>
              <textarea
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                rows={2}
                placeholder="What kinds of products does your store specialize in?"
                className="w-full bg-slate-900 border border-teal-500/30 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* Delivery-specific fields */}
        {role === 'DELIVERY_PARTNER' && (
          <div className="pt-2 border-t border-white/5">
            <label className="block text-xs font-semibold text-amber-300 mb-1">Vehicle Type</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="BIKE">Motorcycle / Scooter</option>
              <option value="EV_SCOOTER">EV Scooter</option>
              <option value="VAN">Delivery Van</option>
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5"
        >
          <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="pt-2 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <NextLink href="/login" className="text-brand-400 font-bold hover:underline">
            Sign in
          </NextLink>
        </div>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={<div className="max-w-md mx-auto py-12 text-center text-slate-400 text-xs">Loading registration...</div>}>
      <RegisterForm />
    </React.Suspense>
  );
}

