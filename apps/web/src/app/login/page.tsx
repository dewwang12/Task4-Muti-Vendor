'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { ShoppingBag, Lock, Mail, ArrowRight, User, Store, ShieldAlert, Bike, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = await login(email, password);
    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Failed to authenticate');
    }
    setIsLoading(false);
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string, redirectPath: string) => {
    setIsLoading(true);
    setError('');
    const res = await login(demoEmail, demoPass);
    if (res.success) {
      router.push(redirectPath);
    } else {
      setError(res.error || 'Demo login failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-teal-500/20">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white font-heading">Sign In to MarketHub</h1>
        <p className="text-xs text-slate-400">Access your customer account, vendor storefront, or rider portal.</p>
      </div>

      {/* 1-Click Role Switcher Demo Cards */}
      <div className="glass-panel rounded-2xl p-4 border border-teal-500/30 bg-teal-500/5 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
          <Sparkles className="w-4 h-4" />
          <span>Quick Demo Roles (1-Click Login):</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('admin@markethub.com', 'Admin@123456', '/admin')}
            className="p-2.5 rounded-xl bg-slate-900 border border-red-500/30 hover:bg-slate-850 text-left transition-colors"
          >
            <div className="flex items-center gap-1.5 font-bold text-red-400">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">Platform Control</p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('techstore@vendor.com', 'Vendor@123456', '/vendor')}
            className="p-2.5 rounded-xl bg-slate-900 border border-teal-500/30 hover:bg-slate-850 text-left transition-colors"
          >
            <div className="flex items-center gap-1.5 font-bold text-teal-400">
              <Store className="w-3.5 h-3.5" />
              <span>Vendor 1</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">AeroTech Electronics</p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('john.doe@example.com', 'Customer@123456', '/')}
            className="p-2.5 rounded-xl bg-slate-900 border border-brand-500/30 hover:bg-slate-850 text-left transition-colors"
          >
            <div className="flex items-center gap-1.5 font-bold text-brand-400">
              <User className="w-3.5 h-3.5" />
              <span>Customer</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">John Doe</p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('rider1@delivery.com', 'Rider@123456', '/delivery')}
            className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 hover:bg-slate-850 text-left transition-colors"
          >
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Bike className="w-3.5 h-3.5" />
              <span>Rider</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">Ramesh Patel</p>
          </button>
        </div>
      </div>

      {/* Standard Form */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-1.5"
        >
          <span>{isLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="pt-2 text-center text-xs text-slate-400">
          Don&apos;t have an account?{' '}
          <NextLink href="/register" className="text-brand-400 font-bold hover:underline">
            Register now
          </NextLink>
        </div>
      </form>
    </div>
  );
}
