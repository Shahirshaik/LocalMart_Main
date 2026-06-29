"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, Globe } from "lucide-react";

import HeroSearch      from "@/components/home/HeroSearch";
import TrustBar        from "@/components/home/TrustBar";
import LiveTicker      from "@/components/home/LiveTicker";
import PersonaShowcase from "@/components/home/PersonaShowcase";
import { OLXHeader }         from "@/components/layout/OLXHeader";
import { CategoryScrollGrid } from "@/components/home/CategoryScrollGrid";
import { VerifiedBanner }     from "@/components/home/VerifiedBanner";
import { RecentlyViewed }     from "@/components/home/RecentlyViewed";
import { AdCarousel }         from "@/components/home/AdCarousel";

// ── Data ─────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: "📍",
    title: "Pick Your Location",
    desc: "Drill down to State → District → Mandal → Village → PIN. We remember your location.",
    gradient: "from-violet-600 to-purple-500",
  },
  {
    step: "02",
    icon: "📋",
    title: "Browse or Post",
    desc: "All 12 verticals. Buy, sell, rent, hire. Free listing for everyone — always.",
    gradient: "from-blue-600 to-indigo-500",
  },
  {
    step: "03",
    icon: "🤝",
    title: "Agent Connects You",
    desc: "A verified LocalMart agent facilitates the deal — trust on both sides.",
    gradient: "from-emerald-600 to-teal-500",
  },
  {
    step: "04",
    icon: "⚡",
    title: "Deal Closes Fast",
    desc: "Real people, real transactions. Hyperlocal speed at national scale.",
    gradient: "from-amber-600 to-orange-500",
  },
];

// ── Hero Section ──────────────────────────────────────────────

function Hero() {
  return (
    <section className="hero-gradient pt-0 pb-0 relative overflow-hidden">
      {/* Ambient light orbs */}
      <div className="absolute top-16 left-[8%] h-80 w-80 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #A78BFA, transparent)" }} />
      <div className="absolute top-32 right-[6%] h-60 w-60 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #F59E0B, transparent)" }} />
      <div className="absolute bottom-0 left-[40%] h-40 w-80 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #7C3AED, transparent)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-20 relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#FDE68A" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            India's Most Trusted Hyper-Local Marketplace · 6,00,000+ Villages
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.08] tracking-tight mb-5"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.25)" }}>
            हर गाँव का{" "}
            <span style={{
              background: "linear-gradient(90deg, #FCD34D, #F59E0B, #FBBF24)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              अपना बाज़ार
            </span>
          </h1>
          <p className="text-purple-200 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            From farm-fresh vegetables to real estate, gas, mechanics, and jobs —
            every Indian service, hyperlocal to your{" "}
            <span className="text-white font-bold">PIN code</span>.
          </p>
        </div>

        {/* Category icon pill row — horizontal scroll on mobile */}
        <div className="overflow-x-auto pb-2 mb-10 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
          <div className="flex items-center gap-2 min-w-max sm:flex-wrap sm:justify-center">
            {[
              { icon: "🥬", label: "Vegetables" },
              { icon: "🍽️", label: "Tiffin" },
              { icon: "🔥", label: "Gas Cylinders" },
              { icon: "🏠", label: "Property" },
              { icon: "🔧", label: "Mechanics" },
              { icon: "💼", label: "Jobs" },
              { icon: "🚗", label: "Vehicles" },
              { icon: "📱", label: "Electronics" },
            ].map(cat => (
              <Link key={cat.label} href={`/listings?q=${encodeURIComponent(cat.label.toLowerCase())}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "rgba(255,255,255,0.85)",
                }}>
                <span>{cat.icon}</span>
                <span className="whitespace-nowrap">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Smart search */}
        <div className="mb-14">
          <HeroSearch />
        </div>

        {/* Two CTAs */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 hover:scale-105"
            style={{ background: "linear-gradient(135deg, #F59E0B, #FBBF24)", color: "#1E0A3C", boxShadow: "0 4px 24px rgba(245,158,11,0.45)" }}>
            Post Free Listing ⚡
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/auth/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm text-white transition-all hover:bg-white/15"
            style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.2)" }}>
            Browse Marketplace →
          </Link>
        </div>

        <AdCarousel />
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
            style={{ background: "rgba(124,58,237,0.08)", color: "#6D28D9", border: "1px solid rgba(124,58,237,0.15)" }}>
            🚀 Simple & Fast
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">How LocalMart Works</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">From registration to deal close in under 10 minutes.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((s, i) => (
            <div key={s.step}
              className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              {/* Connector line */}
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="hidden lg:block absolute top-11 left-full w-6 h-0.5 bg-gray-100 z-10" />
              )}

              {/* Step number + icon */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                  {s.icon}
                </div>
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ background: "linear-gradient(135deg, #4C1D95, #7C3AED)" }}>
                  {parseInt(s.step, 10)}
                </div>
              </div>

              <h3 className="font-black text-gray-900 mb-2 text-base">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>

              {/* Hover underline accent */}
              <div className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-gradient-to-r ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── AI Section ────────────────────────────────────────────────

function AISection() {
  const AGENTS = [
    { icon: "⚙️", name: "Operations Agent",  role: "Supply & Demand Intelligence", desc: "Scans every PIN code 5× daily. Detects shortages, flags surpluses, dispatches tasks." },
    { icon: "📊", name: "Marketing Agent",   role: "Social Media Automation",       desc: "Writes localized posts in EN/HI/TE. Posts to Instagram, Facebook, LinkedIn autonomously." },
    { icon: "👥", name: "User Proxy Agent",  role: "Buyer–Seller Matchmaker",       desc: "Matches buyers to sellers with a 0–1 score algorithm. Handles WhatsApp inquiries end-to-end." },
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0F0520 0%, #1E0A3C 35%, #2D1B69 60%, #4C1D95 85%, #6D28D9 100%)" }}>

      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold mb-6"
            style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#FCD34D" }}>
            🤖 Autonomous AI Ecosystem
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Three AI Agents.<br />
            <span style={{
              background: "linear-gradient(90deg, #FCD34D, #F59E0B)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
            }}>One Intelligent Marketplace.</span>
          </h2>
          <p className="text-purple-300 text-lg max-w-2xl mx-auto leading-relaxed">
            Autonomous agents work 24/7 — but every high-impact action goes through a
            Board → CEO approval loop before execution.
          </p>
        </div>

        {/* Agent cards */}
        <div className="grid sm:grid-cols-3 gap-5 mb-12">
          {AGENTS.map((a, i) => (
            <div key={a.name}
              className="relative rounded-2xl p-6 group hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
              }}>
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: "radial-gradient(circle at 50% 0%, rgba(167,139,250,0.12), transparent 70%)" }} />

              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.6), rgba(76,29,149,0.6))", border: "1px solid rgba(167,139,250,0.3)" }}>
                  {a.icon}
                </div>
                <span className="text-xs font-bold text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full">
                  Agent {i + 1}
                </span>
              </div>

              <h3 className="font-black text-white text-base mb-1">{a.name}</h3>
              <p className="text-purple-400 text-xs font-semibold mb-3">{a.role}</p>
              <p className="text-purple-300 text-sm leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>

        {/* Approval chain visualization */}
        <div className="rounded-2xl p-6 text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-4">Approval Loop — Humans Always in Control</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { label: "AI Agent", icon: "🤖", color: "from-violet-600 to-purple-500" },
              { label: "Board Review", icon: "👥", color: "from-amber-600 to-yellow-500" },
              { label: "CEO Sign-off", icon: "👑", color: "from-purple-600 to-indigo-500" },
              { label: "Execute", icon: "⚡", color: "from-green-600 to-emerald-500" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-lg`}>
                    {step.icon}
                  </div>
                  <span className="text-xs text-purple-400 font-medium mt-1">{step.label}</span>
                </div>
                {i < 3 && (
                  <svg className="h-4 w-4 text-purple-600 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── India Coverage ────────────────────────────────────────────

function IndiaCoverage() {
  const NUMBERS = [
    { val: "28+",   label: "States & UTs",   icon: "🗺️" },
    { val: "793",   label: "Districts",       icon: "🏙️" },
    { val: "5,000+",label: "Taluks & Blocks", icon: "🏘️" },
    { val: "6L+",   label: "Villages",        icon: "🏡" },
  ];

  return (
    <section className="py-20 px-4" style={{ background: "linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 100%)" }}>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
            style={{ background: "rgba(124,58,237,0.1)", color: "#6D28D9", border: "1px solid rgba(124,58,237,0.2)" }}>
            <Globe className="h-3 w-3" /> All of India
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 leading-tight">
            Pinpoint accuracy down to the{" "}
            <span style={{
              background: "linear-gradient(135deg, #4C1D95, #7C3AED)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
            }}>6-digit PIN code</span>
          </h2>
          <p className="text-gray-600 text-lg mb-10 leading-relaxed">
            Every state, district, taluk, and village structured so you always transact with someone genuinely nearby.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-10">
            {NUMBERS.map(n => (
              <div key={n.label} className="rounded-2xl border border-purple-100 bg-white p-5"
                style={{ boxShadow: "0 2px 12px rgba(124,58,237,0.06)" }}>
                <div className="text-2xl mb-2">{n.icon}</div>
                <div className="text-2xl font-black" style={{ color: "#6D28D9" }}>{n.val}</div>
                <div className="text-xs text-gray-400 font-medium mt-0.5">{n.label}</div>
              </div>
            ))}
          </div>
          <Link href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #4C1D95, #7C3AED)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
            Start in Your Village <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Map-style PIN illustration */}
        <div className="relative">
          <div className="rounded-3xl overflow-hidden"
            style={{ background: "linear-gradient(145deg, #1E0A3C, #2D1B69, #1E0A3C)", padding: "2px" }}>
            <div className="rounded-3xl overflow-hidden"
              style={{ background: "linear-gradient(145deg, #0F0520, #1E0A3C)" }}>

              {/* India PIN map placeholder */}
              <div className="relative h-64 flex items-center justify-center overflow-hidden">
                {/* Decorative dots resembling PIN code coverage */}
                {[
                  { x: "20%", y: "25%", size: "h-3 w-3", opacity: 0.9, color: "#A78BFA" },
                  { x: "35%", y: "40%", size: "h-4 w-4", opacity: 1,   color: "#F59E0B" },
                  { x: "55%", y: "30%", size: "h-2 w-2", opacity: 0.7, color: "#34D399" },
                  { x: "70%", y: "55%", size: "h-3 w-3", opacity: 0.8, color: "#60A5FA" },
                  { x: "25%", y: "65%", size: "h-2 w-2", opacity: 0.6, color: "#A78BFA" },
                  { x: "50%", y: "60%", size: "h-5 w-5", opacity: 1,   color: "#7C3AED", pulse: true },
                  { x: "80%", y: "35%", size: "h-2 w-2", opacity: 0.5, color: "#FCD34D" },
                  { x: "42%", y: "75%", size: "h-3 w-3", opacity: 0.8, color: "#F87171" },
                  { x: "60%", y: "70%", size: "h-2 w-2", opacity: 0.6, color: "#34D399" },
                  { x: "15%", y: "50%", size: "h-2 w-2", opacity: 0.5, color: "#A78BFA" },
                ].map((dot, i) => (
                  <div key={i}
                    className={`absolute ${dot.size} rounded-full ${dot.pulse ? "animate-pulse" : ""}`}
                    style={{ left: dot.x, top: dot.y, background: dot.color, opacity: dot.opacity, boxShadow: `0 0 8px ${dot.color}` }} />
                ))}

                {/* Central India outline hint */}
                <svg viewBox="0 0 200 220" className="absolute inset-0 w-full h-full opacity-10">
                  <path d="M100 20 L140 40 L160 80 L150 120 L130 160 L100 190 L70 160 L50 120 L40 80 L60 40 Z"
                    fill="none" stroke="white" strokeWidth="1" />
                </svg>

                <div className="text-4xl font-black text-white/10 select-none">INDIA</div>
              </div>

              {/* Coverage stats */}
              <div className="p-5 border-t border-white/8">
                {["Telangana · 9 districts live", "Maharashtra · 35 districts live", "Karnataka · 30 districts live"].map(s => (
                  <div key={s} className="flex items-center gap-2 mb-2 last:mb-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-purple-300">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-purple-100">
            <div className="text-xs text-gray-400 mb-1">Active in 508 207</div>
            <div className="text-2xl font-black" style={{ color: "#6D28D9" }}>247</div>
            <div className="text-xs text-gray-400">listings now</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-20 px-4"
      style={{ background: "linear-gradient(135deg, #0F0520, #1E0A3C, #3B0764)" }}>
      <div className="max-w-3xl mx-auto text-center">
        <div className="text-5xl mb-6">🇮🇳</div>
        <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight">
          Start selling in your<br />village today
        </h2>
        <p className="text-purple-300 mb-10 text-lg">Free to join. No commission on first 10 listings. Always local.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/auth/signup"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 hover:scale-105"
            style={{ background: "linear-gradient(135deg, #F59E0B, #FBBF24)", color: "#1E0A3C", boxShadow: "0 4px 24px rgba(245,158,11,0.5)" }}>
            Sign Up Free ⚡ <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/auth/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm text-white transition-all hover:bg-white/15"
            style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.2)" }}>
            I already have an account →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-10 px-4" style={{ background: "#1e1b4b", color: "#9ca3af" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/10 pb-8 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #3B0764, #7C3AED)" }}>
              <ShoppingBag className="text-white" style={{ width: 15, height: 15 }} />
            </div>
            <span className="text-white font-black text-lg">LocalMart</span>
            <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: "#92400E", color: "#FEF3C7" }}>
              Made in India 🇮🇳
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {["Privacy Policy", "Terms of Service", "Contact", "Become an Agent", "API"].map(l => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
        <div className="text-center text-xs" style={{ color: "#6b7280" }}>
          © 2025 LocalMart Technologies Pvt. Ltd. · CIN: U72900TG2025PTC000001 · All rights reserved
        </div>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] pb-16 md:pb-0">
      <OLXHeader />
      <div className="bg-white">
        <Hero />
      </div>
      <TrustBar />
      <LiveTicker />
      <CategoryScrollGrid />
      <VerifiedBanner />
      <RecentlyViewed />
      <div className="bg-white mt-2">
        <HowItWorks />
      </div>
      <PersonaShowcase />
      <AISection />
      <IndiaCoverage />
      <FinalCTA />
      <Footer />
    </div>
  );
}
