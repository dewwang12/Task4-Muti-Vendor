import React from 'react';
import NextLink from 'next/link';
import { ShoppingBag, ShieldCheck, Truck, RefreshCw, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-md mt-20">
      {/* Value Proposition Banners */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Multi-Vendor Protection</p>
              <p className="text-[11px] text-slate-400">Verified seller storefronts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Real-Time Dispatch</p>
              <p className="text-[11px] text-slate-400">Order-level carrier tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Atomic Checkouts</p>
              <p className="text-[11px] text-slate-400">Zero inventory overselling</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Single Checkout Flow</p>
              <p className="text-[11px] text-slate-400">Buy from multiple vendors once</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white font-heading">
                Market<span className="text-teal-400">Hub</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The premier scalable multi-vendor marketplace connecting consumers with specialized independent sellers and direct carrier fulfillment.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Marketplace</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><NextLink href="/products" className="hover:text-teal-400 transition-colors">All Products</NextLink></li>
              <li><NextLink href="/products?category=electronics-audio" className="hover:text-teal-400 transition-colors">Electronics & Audio</NextLink></li>
              <li><NextLink href="/products?category=fashion-bags" className="hover:text-teal-400 transition-colors">Fashion & Bags</NextLink></li>
              <li><NextLink href="/products?category=home-living" className="hover:text-teal-400 transition-colors">Home & Living</NextLink></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Partnerships</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><NextLink href="/register?role=VENDOR" className="hover:text-teal-400 transition-colors">Become a Vendor</NextLink></li>
              <li><NextLink href="/register?role=DELIVERY_PARTNER" className="hover:text-teal-400 transition-colors">Delivery Partner Signup</NextLink></li>
              <li><NextLink href="/vendor" className="hover:text-teal-400 transition-colors">Seller Dashboard</NextLink></li>
              <li><NextLink href="/delivery" className="hover:text-teal-400 transition-colors">Dispatch Portal</NextLink></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Platform Specs</h4>
            <div className="space-y-1 text-xs text-slate-400">
              <p>Next.js 14 App Router</p>
              <p>NestJS 10 Enterprise REST</p>
              <p>PostgreSQL 16 + Prisma ORM</p>
              <p>Minor-unit Paise financial ledger</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© 2026 MarketHub Inc. Task 4 Multi-Vendor Implementation.</p>
          <div className="flex gap-4">
            <span>Enterprise Multi-Tenant</span>
            <span>•</span>
            <span>Zero Overselling Guarantee</span>
            <span>•</span>
            <span>Atomic Checkouts</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
