import React from 'react';
import NextLink from 'next/link';
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Store,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';

async function getHomeData() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${apiUrl}/products?limit=8`, { next: { revalidate: 30 } }),
      fetch(`${apiUrl}/categories`, { next: { revalidate: 60 } }),
    ]);

    const products = productsRes.ok ? (await productsRes.json()).data?.items || [] : [];
    const categories = categoriesRes.ok ? (await categoriesRes.json()).data || [] : [];

    return {
      products: products.length > 0 ? products : fallbackProducts,
      categories: categories.length > 0 ? categories : fallbackCategories,
    };
  } catch {
    return {
      products: fallbackProducts,
      categories: fallbackCategories,
    };
  }
}

const fallbackCategories = [
  {
    id: 'cat-1',
    name: 'Electronics & Audio',
    slug: 'electronics-audio',
    description: 'High fidelity audio, wireless headphones, and gear',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  },
  {
    id: 'cat-2',
    name: 'Fashion & Bags',
    slug: 'fashion-bags',
    description: 'Handcrafted leather backpacks, wallets, and accessories',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
  },
  {
    id: 'cat-3',
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Modern workspace aesthetics and minimalist decor',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400',
  },
];

const fallbackProducts = [
  {
    id: 'prod-fallback-1',
    title: 'AeroPulse ANC Wireless Headphones',
    slug: 'aeropulse-anc-wireless-headphones',
    description: 'Industry-leading 40dB Hybrid Active Noise Cancellation with 50-hour battery life.',
    priceMinor: 499900,
    compareAtPriceMinor: 699900,
    sku: 'AERO-ANC-001',
    availableStock: 25,
    vendor: { id: 'ven-1', storeName: 'TechStore Pro', slug: 'techstore-pro' },
    category: { name: 'Electronics & Audio', slug: 'electronics-audio' },
    images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', altText: 'Headphones' }],
    reviewsCount: 24,
  },
  {
    id: 'prod-fallback-2',
    title: 'ApexGlide Wireless Mechanical Keyboard',
    slug: 'apexglide-wireless-mechanical-keyboard',
    description: 'Hot-swappable switches, PBT dye-sub keycaps, and ultra-low 2.4GHz latency.',
    priceMinor: 649900,
    compareAtPriceMinor: 899900,
    sku: 'APEX-KB-002',
    availableStock: 14,
    vendor: { id: 'ven-1', storeName: 'TechStore Pro', slug: 'techstore-pro' },
    category: { name: 'Electronics & Audio', slug: 'electronics-audio' },
    images: [{ url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800', altText: 'Keyboard' }],
    reviewsCount: 19,
  },
  {
    id: 'prod-fallback-3',
    title: 'Artisan Voyager Full-Grain Leather Backpack',
    slug: 'artisan-voyager-leather-backpack',
    description: 'Vegetable-tanned premium leather backpack with dedicated 16-inch padded laptop sleeve.',
    priceMinor: 389900,
    compareAtPriceMinor: 549900,
    sku: 'ARTISAN-BP-003',
    availableStock: 8,
    vendor: { id: 'ven-2', storeName: 'UrbanCraft Apparel', slug: 'urbancraft-apparel' },
    category: { name: 'Fashion & Bags', slug: 'fashion-bags' },
    images: [{ url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', altText: 'Leather Backpack' }],
    reviewsCount: 31,
  },
  {
    id: 'prod-fallback-4',
    title: 'Minimalist Bi-Fold Leather Wallet',
    slug: 'minimalist-bifold-leather-wallet',
    description: 'Slimline RFID-blocking genuine top-grain leather wallet with quick card access.',
    priceMinor: 129900,
    compareAtPriceMinor: 199900,
    sku: 'ARTISAN-WL-004',
    availableStock: 30,
    vendor: { id: 'ven-2', storeName: 'UrbanCraft Apparel', slug: 'urbancraft-apparel' },
    category: { name: 'Fashion & Bags', slug: 'fashion-bags' },
    images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800', altText: 'Wallet' }],
    reviewsCount: 12,
  },
];

export default async function HomePage() {
  const { products, categories } = await getHomeData();

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-12 lg:p-16 border border-white/10 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Next-Gen Multi-Vendor Commerce</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Independent Brands. <br />
            <span className="bg-gradient-to-r from-brand-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              One Unified Checkout.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Discover premium audio gear, handcrafted leather, and artisan products from verified independent merchants. Add items from multiple vendors to a single cart with atomic order splitting and live dispatch tracking.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <NextLink
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 hover:scale-105 transition-all"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </NextLink>

            <NextLink
              href="/register?role=VENDOR"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass-card text-white font-medium text-sm hover:border-brand-500/40 transition-colors"
            >
              <Store className="w-4 h-4 text-brand-400" />
              <span>Sell on MarketHub</span>
            </NextLink>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-xs">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white font-heading">100%</p>
              <p className="text-slate-400">Atomic Stock Locks</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-teal-400 font-heading">Multi-Vendor</p>
              <p className="text-slate-400">Single Cart Flow</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white font-heading">Direct</p>
              <p className="text-slate-400">Carrier Dispatch</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Curated Categories</h2>
            <p className="text-xs text-slate-400 mt-1">Explore verified vendor departments</p>
          </div>
          <NextLink
            href="/products"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NextLink>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {categories.map((cat: any) => (
            <NextLink
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group glass-card rounded-2xl overflow-hidden p-6 relative border border-white/5 hover:border-brand-500/30"
            >
              <div className="relative z-10 space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-brand-400 font-bold">
                  Department
                </span>
                <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">{cat.description}</p>
                <div className="pt-2 text-xs font-semibold text-teal-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Browse Category</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 opacity-15 group-hover:opacity-25 transition-opacity">
                {cat.imageUrl && (
                  <img src={cat.imageUrl} alt="" className="w-full h-full object-cover rounded-tl-3xl" />
                )}
              </div>
            </NextLink>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Trending Multi-Vendor Items</h2>
            <p className="text-xs text-slate-400 mt-1">Cross-vendor products ready for immediate dispatch</p>
          </div>
          <NextLink
            href="/products"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>See Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NextLink>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center border border-white/5 space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-white">Products Catalog Initializing</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ensure the NestJS backend and database are running to display seeded live multi-vendor items.
            </p>
          </div>
        )}
      </section>

      {/* Multi-Vendor Architecture Visualizer Banner */}
      <section className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 bg-slate-900/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold border border-teal-500/20">
              <Layers className="w-3.5 h-3.5" />
              <span>Architectural Highlight</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
              How MarketHub Multi-Vendor Order Splitting Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              When a customer purchases items from different independent sellers in a single checkout, MarketHub's backend engine executes an atomic transaction that:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Locks inventory row via <code className="text-teal-300 font-mono">SELECT ... FOR UPDATE</code> to eliminate overselling.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Creates Parent Order for the customer checkout and splits individual sub-orders for each vendor.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Computes platform commission basis points and net vendor payables automatically.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Spawns dedicated delivery partner assignments per vendor sub-order.</span>
              </li>
            </ul>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-white/10 font-mono text-xs space-y-3 bg-slate-950/80">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-slate-400 text-[11px]">
              <span>CHECKOUT_TRANSACTION</span>
              <span className="text-emerald-400">ACID_ATOMIC</span>
            </div>
            <div className="space-y-1.5 text-slate-300">
              <p className="text-teal-400 font-bold">🛒 Customer Cart: [AeroTech, UrbanCraft]</p>
              <p className="pl-3 text-slate-400">└─ Parent Order: MH-2026-10001 (Total ₹6,298.00)</p>
              <p className="pl-6 text-brand-300">├─ Sub-Order 1: AeroTech (₹4,999.00)</p>
              <p className="pl-9 text-slate-400">│  └─ Commission (10%): ₹499.90 | Payout: ₹4,499.10</p>
              <p className="pl-6 text-amber-300">└─ Sub-Order 2: UrbanCraft (₹1,299.00)</p>
              <p className="pl-9 text-slate-400">   └─ Commission (12%): ₹155.88 | Payout: ₹1,143.12</p>
            </div>
            <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400 flex justify-between">
              <span>Status: CONFIRMED</span>
              <span className="text-teal-400">Delivered via Riders</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
