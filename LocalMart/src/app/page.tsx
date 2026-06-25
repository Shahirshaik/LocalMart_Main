import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import {
  Search, MapPin, TrendingUp, Shield, Zap, Users,
  ArrowRight, Star, Megaphone, Tag, Sparkles, Phone,
} from "lucide-react";
import type { UserRole, ListingFull } from "@/types/database";

const CATEGORIES = [
  { slug: "agriculture", name: "Agriculture", icon: "🌾", color: "bg-green-50 hover:bg-green-100 text-green-700 border border-green-100" },
  { slug: "electronics", name: "Electronics", icon: "📱", color: "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100" },
  { slug: "vehicles",    name: "Vehicles",    icon: "🚗", color: "bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-100" },
  { slug: "property",    name: "Property",    icon: "🏡", color: "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100" },
  { slug: "clothing",    name: "Clothing",    icon: "👗", color: "bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-100" },
  { slug: "food",        name: "Food",        icon: "🍎", color: "bg-red-50 hover:bg-red-100 text-red-700 border border-red-100" },
  { slug: "furniture",   name: "Furniture",   icon: "🛋️", color: "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100" },
  { slug: "services",    name: "Services",    icon: "🔧", color: "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-100" },
  { slug: "jobs",        name: "Jobs",        icon: "💼", color: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100" },
  { slug: "education",   name: "Education",   icon: "📚", color: "bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100" },
  { slug: "health",      name: "Health",      icon: "💊", color: "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100" },
  { slug: "other",       name: "Other",       icon: "📦", color: "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100" },
];

const FEATURES = [
  { icon: Zap,        title: "Post in 60 Seconds", desc: "List your item or service for free in under a minute", color: "bg-yellow-100 text-yellow-600" },
  { icon: MapPin,     title: "Village-Level Reach", desc: "Connect with buyers and sellers in your exact locality", color: "bg-blue-100 text-blue-600" },
  { icon: Shield,     title: "Verified Listings",   desc: "Agents verify every listing for trust and quality", color: "bg-green-100 text-green-600" },
  { icon: TrendingUp, title: "Grow Your Business",  desc: "Services and products reach thousands of local users", color: "bg-purple-100 text-purple-600" },
];

const TICKER_ITEMS = [
  "🌾 Fresh vegetables available in Pamuru",
  "🏡 House plot for sale in Markapur",
  "💼 Daily wage jobs in Prakasam district",
  "📱 Second-hand mobiles — best prices in Pamuru",
  "🔧 Electrician available in Pamuru mandal",
  "🚗 Auto-rickshaw for sale in Markapur",
  "🍎 Mango crop directly from Pamuru farm",
  "📚 Home tuition for 8th–10th in Pamuru",
  "🌿 Red chilli (mirchi) available — Prakasam district",
  "🐄 Jersey cow for sale — Pamuru area",
  "🏗️ Construction materials — Markapur",
  "👗 New & used clothing — Pamuru weekly bazaar",
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userRole: UserRole | null = null;
  if (user) {
    const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
    userRole = data?.role ?? null;
  }

  const { data: featuredListings } = await supabase
    .from("listings")
    .select("*, village:villages(*), category:categories(*)")
    .eq("status", "featured")
    .order("created_at", { ascending: false })
    .limit(4);

  const { data: recentListings } = await supabase
    .from("listings")
    .select("*, village:villages(*), category:categories(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  const { count: totalListings } = await supabase
    .from("listings").select("*", { count: "exact", head: true }).eq("status", "active");
  const { count: totalVillages } = await supabase
    .from("villages").select("*", { count: "exact", head: true }).eq("is_active", true);
  const { count: totalUsers } = await supabase
    .from("users").select("*", { count: "exact", head: true });

  const tickerText = TICKER_ITEMS.join("   •   ");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userRole={userRole} userEmail={user?.email} />

      {/* ── Announcement Ticker ──────────────────────────────── */}
      <div className="bg-brand-700 text-white py-2 overflow-hidden">
        <div className="flex items-center gap-3 px-4">
          <span className="shrink-0 flex items-center gap-1.5 bg-yellow-400 text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full">
            <Megaphone className="h-3 w-3" /> LIVE
          </span>
          <div className="overflow-hidden flex-1">
            <div className="animate-marquee whitespace-nowrap text-sm text-purple-100 inline-block">
              {tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerText}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero-gradient text-white">
        {/* Floating decorative blobs */}
        <div className="absolute top-20 left-10 text-4xl animate-float opacity-30 pointer-events-none select-none">🌾</div>
        <div className="absolute top-32 right-16 text-3xl animate-float-delay opacity-25 pointer-events-none select-none">🏡</div>
        <div className="absolute bottom-24 left-1/4 text-2xl animate-float-slow opacity-20 pointer-events-none select-none">📱</div>
        <div className="absolute top-16 right-1/3 text-2xl animate-float opacity-20 pointer-events-none select-none">🚗</div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-24 relative z-10">
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-sm font-medium mb-6 border border-white/20">
              <Star className="h-3.5 w-3.5 text-yellow-300" fill="currentColor" />
              <span>India&apos;s Village Marketplace</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Buy &amp; Sell in Your{" "}
              <span className="text-yellow-300 drop-shadow-lg">Village</span>
            </h1>
            <p className="text-lg text-purple-100 mb-10 max-w-lg mx-auto">
              LocalMart connects you with buyers, sellers and services right in your neighborhood. Free, fast and trusted.
            </p>
            <form action="/listings" method="GET" className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="q" placeholder="Search listings, services, items..."
                  className="w-full rounded-xl border-0 bg-white pl-11 pr-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg text-sm" />
              </div>
              <button type="submit"
                className="rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-semibold text-gray-900 hover:bg-yellow-300 transition-colors shadow-lg">
                Search
              </button>
            </form>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-purple-200">
              <Link href="/listings?type=sell"    className="hover:text-white transition-colors">Buy Items</Link>
              <Link href="/listings?type=service" className="hover:text-white transition-colors">Find Services</Link>
              <Link href="/listings?type=rent"    className="hover:text-white transition-colors">Rentals</Link>
              <Link href="/listings/new"          className="hover:text-white transition-colors font-semibold text-yellow-300">Post Free ✨</Link>
            </div>
          </div>
        </div>
        <div className="h-12 bg-gray-50" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="bg-gray-50 pb-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: totalListings ?? 0, label: "Active Listings", icon: "📋" },
              { value: totalVillages ?? 0, label: "Villages",         icon: "🏘️" },
              { value: totalUsers ?? 0,    label: "Members",          icon: "👥" },
            ].map((stat) => (
              <div key={stat.label} className="card p-4 text-center hover:shadow-md transition-shadow">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <p className="text-2xl font-extrabold text-brand-600">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="flex-1 bg-gray-50">

        {/* ── Categories ───────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Browse by Category</h2>
            <Link href="/listings" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={"/listings?category=" + cat.slug}
                className={"flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all hover:shadow-md hover:-translate-y-1 " + cat.color}>
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-xs font-semibold">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Advertisement Banner 1 ───────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-8">
          <div className="ad-banner-primary rounded-3xl p-6 sm:p-8 text-white overflow-hidden relative">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-12 -left-6 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute top-4 right-40 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold mb-3">
                  <Sparkles className="h-3 w-3 text-yellow-300" /> SPECIAL OFFER
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold mb-2">
                  🎉 Post Your Listing FREE Today!
                </h3>
                <p className="text-white/80 text-sm max-w-md">
                  Reach thousands of buyers in your village. No hidden charges, no commission. Just post and sell!
                </p>
              </div>
              <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                <Link href="/listings/new"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-orange-600 hover:bg-yellow-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Post Free Now <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/listings"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/25 transition-all">
                  Browse Deals
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Featured Listings ────────────────────────────────── */}
        {featuredListings && featuredListings.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" fill="currentColor" />
                Featured Listings
              </h2>
              <Link href="/listings" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(featuredListings as ListingFull[]).map((l, i) => (
                <ListingCard key={l.id} listing={l} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ── Advertisement Banner 2 ───────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <div className="ad-banner-secondary rounded-3xl overflow-hidden relative">
            {/* Animated gradient orbs */}
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-6 sm:p-10">
              {/* Left side – ad content */}
              <div className="flex-1 text-white">
                <div className="inline-flex items-center gap-1.5 bg-cyan-400/20 border border-cyan-400/30 rounded-full px-3 py-1 text-xs font-semibold text-cyan-300 mb-4">
                  <Tag className="h-3 w-3" /> ADVERTISE WITH US
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-snug">
                  Grow Your Business<br />
                  <span className="text-cyan-300">with LocalMart Ads</span>
                </h3>
                <p className="text-white/70 text-sm mb-5 max-w-sm">
                  Put your shop, service or product in front of local buyers every day. Affordable plans starting from ₹99/month.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 text-sm text-white/80">
                    ✅ 5,000+ daily views
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 text-sm text-white/80">
                    ✅ Village targeting
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 text-sm text-white/80">
                    ✅ No tech skills needed
                  </div>
                </div>
              </div>
              {/* Right side – CTA card */}
              <div className="shrink-0 glass rounded-2xl p-6 text-white text-center min-w-[200px]">
                <div className="text-4xl mb-3">📣</div>
                <p className="font-bold text-lg mb-1">Book Your Ad</p>
                <p className="text-white/60 text-xs mb-4">Limited spots available</p>
                <a href="tel:+919876543210"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-cyan-400 text-gray-900 px-4 py-2.5 text-sm font-bold hover:bg-cyan-300 transition-all">
                  <Phone className="h-4 w-4" /> Call Us
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Recent Listings ──────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 pb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Recent Listings</h2>
            <Link href="/listings" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentListings && recentListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(recentListings as ListingFull[]).map((l, i) => (
                <ListingCard key={l.id} listing={l} index={i + 4} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🛒</p>
              <p className="font-medium">No listings yet — be the first to post!</p>
              <Link href="/listings/new" className="btn-primary mt-4 inline-flex">Post a Free Listing</Link>
            </div>
          )}
        </section>

        {/* ── Advertisement Banner 3 — Green ──────────────────── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-10">
          <div className="ad-banner-green rounded-3xl p-6 sm:p-8 text-white overflow-hidden relative">
            <div className="absolute -top-10 right-20 w-48 h-48 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-10 w-40 h-40 rounded-full bg-green-300/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="text-5xl animate-float shrink-0">🌿</div>
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-400/20 rounded-full px-3 py-1 text-xs font-semibold text-emerald-300 mb-2">
                    🌱 LOCAL FARMERS
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold mb-1">
                    Fresh from the Farm — Directly to You
                  </h3>
                  <p className="text-white/70 text-sm">
                    Connect with local farmers and get fresh produce at fair prices. Support your community.
                  </p>
                </div>
              </div>
              <Link href="/listings?category=agriculture"
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 text-gray-900 px-6 py-3 text-sm font-bold hover:bg-emerald-300 transition-all shadow-lg whitespace-nowrap">
                Shop Farm Fresh <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Pamuru Community Spotlight ───────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-10">
          <div className="rounded-3xl overflow-hidden border border-orange-100"
            style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #ecfdf5 100%)" }}>
            <div className="flex flex-col md:flex-row items-stretch">

              {/* Left — Community identity */}
              <div className="flex-1 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl">🏘️</span>
                  <div>
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Community Spotlight</p>
                    <h3 className="text-xl font-extrabold text-gray-900">Pamuru &amp; Markapur Area</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  LocalMart is built for villages like <strong>Pamuru</strong> in Prakasam district, Andhra Pradesh.
                  Post your farm produce, services, or second-hand items — your neighbors are right here!
                </p>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    { icon: "🌶️", label: "Mirchi / Red Chilli" },
                    { icon: "🌾", label: "Rice & Paddy" },
                    { icon: "🥜", label: "Groundnuts" },
                    { icon: "🐄", label: "Cattle &amp; Livestock" },
                    { icon: "🛺", label: "Autos &amp; Bikes" },
                    { icon: "🏡", label: "Land &amp; Plots" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 text-xs font-medium text-gray-700">
                      <span>{item.icon}</span>
                      <span dangerouslySetInnerHTML={{ __html: item.label }} />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link href="/listings/new"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white px-5 py-2.5 text-sm font-bold hover:bg-orange-600 transition-all shadow-md">
                    Post in Pamuru Area
                  </Link>
                  <Link href="/listings?district=Prakasam"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-orange-200 text-orange-700 px-5 py-2.5 text-sm font-semibold hover:bg-orange-50 transition-all">
                    Browse Prakasam Listings
                  </Link>
                </div>
              </div>

              {/* Right — Mandals / reach */}
              <div className="md:w-64 bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white flex flex-col justify-center">
                <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider mb-3">Areas We Serve</p>
                <div className="space-y-1.5">
                  {["Pamuru", "Markapur", "Giddalur", "Darsi", "Cumbum", "Ongole", "Kandukur", "Chirala"].map((m) => (
                    <div key={m} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shrink-0" />
                      <span className="text-white/90">{m} Mandal</span>
                    </div>
                  ))}
                  <p className="text-xs text-emerald-300 mt-3">+ all other Prakasam mandals</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Why LocalMart ────────────────────────────────────── */}
        <section className="bg-white border-t border-gray-100 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Why LocalMart?</h2>
              <p className="text-gray-500 max-w-xl mx-auto">The easiest way to buy, sell and find services in your village</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="text-center p-6 rounded-2xl hover:shadow-md transition-all hover:-translate-y-1 border border-gray-50 group">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4 ${color} transition-transform group-hover:scale-110`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────── */}
        <section className="hero-gradient py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center relative z-10">
            <div className="text-4xl mb-4 animate-float inline-block">🎯</div>
            <h2 className="text-3xl font-extrabold text-white mb-4">Ready to get started?</h2>
            <p className="text-purple-200 mb-8 max-w-md mx-auto">Join thousands of villagers already buying and selling on LocalMart</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                <Users className="h-4 w-4" /> Sign Up Free
              </Link>
              <Link href="/listings/new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-yellow-300 transition-all shadow-lg hover:-translate-y-0.5">
                Post a Listing ✨
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
