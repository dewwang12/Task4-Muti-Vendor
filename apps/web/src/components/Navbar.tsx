'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import {
  ShoppingBag,
  ShoppingCart,
  User,
  ShieldAlert,
  Store,
  Bike,
  LogOut,
  Search,
  ChevronDown,
  Layers,
  Package,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, cartCount } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Branding */}
          <NextLink href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white font-heading">
                Market<span className="text-brand-400">Hub</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                Multi-Vendor
              </span>
            </div>
          </NextLink>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, SKUs across all vendors..."
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
          </form>

          {/* Navigation Items & Role Shortcuts */}
          <div className="flex items-center gap-3">
            <NextLink
              href="/products"
              className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              Browse Catalog
            </NextLink>

            {/* Role-Specific Portal Links */}
            {user?.role === 'ADMIN' && (
              <NextLink
                href="/admin"
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin</span>
              </NextLink>
            )}

            {user?.role === 'VENDOR' && (
              <NextLink
                href="/vendor"
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Store Hub</span>
              </NextLink>
            )}

            {user?.role === 'DELIVERY_PARTNER' && (
              <NextLink
                href="/delivery"
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Delivery</span>
              </NextLink>
            )}

            {/* Cart Button */}
            <NextLink
              href="/cart"
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center justify-center"
              aria-label="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-500 text-slate-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </NextLink>

            {/* User Account / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-700/60 bg-slate-850 hover:border-slate-600 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-teal-300">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-200 hidden sm:block max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl glass-dropdown shadow-2xl py-2 z-50 border border-white/10 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-white">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 border border-teal-500/20">
                        {user.role}
                      </span>
                    </div>

                    <NextLink
                      href="/orders"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      My Orders & Shipments
                    </NextLink>

                    {user.role === 'VENDOR' && (
                      <NextLink
                        href="/vendor"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-teal-300 hover:bg-slate-800"
                      >
                        <Store className="w-3.5 h-3.5 text-teal-400" />
                        Vendor Dashboard
                      </NextLink>
                    )}

                    {user.role === 'ADMIN' && (
                      <NextLink
                        href="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-red-300 hover:bg-slate-800"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        Admin Control Center
                      </NextLink>
                    )}

                    {user.role === 'DELIVERY_PARTNER' && (
                      <NextLink
                        href="/delivery"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-amber-300 hover:bg-slate-800"
                      >
                        <Bike className="w-3.5 h-3.5 text-amber-400" />
                        Delivery Jobs Portal
                      </NextLink>
                    )}

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 border-t border-slate-800 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NextLink
                href="/login"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-slate-950 shadow-md shadow-teal-500/20 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </NextLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
