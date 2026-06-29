"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface Slide {
  id: string;
  badge: string;
  heading: string;
  sub: string;
  cta: string;
  href: string;
  emoji: string;
  grad: string;
  accent: string;
}

const SLIDES: Slide[] = [
  {
    id: "restaurant",
    badge: "🍽️ For Food Businesses",
    heading: "List Your Restaurant for FREE",
    sub: "Reach thousands of hungry customers in your locality. Post your menu, daily specials & offers instantly.",
    cta: "List Your Restaurant",
    href: "/listings/new",
    emoji: "🍛",
    grad: "from-orange-500 via-red-500 to-rose-600",
    accent: "#FFCE32",
  },
  {
    id: "property",
    badge: "🏠 Property & Real Estate",
    heading: "Buyers Are Searching Near You",
    sub: "Sell or rent faster with LocalMart's hyperlocal reach. 19K+ PIN codes covered across India.",
    cta: "Post Property Free",
    href: "/listings/new",
    emoji: "🏗️",
    grad: "from-blue-600 via-indigo-600 to-violet-700",
    accent: "#FFCE32",
  },
  {
    id: "advertise",
    badge: "📢 Advertise With Us",
    heading: "Promote Your Business to Millions",
    sub: "Banner ads, featured listings & sponsored slots available. Any business, any vertical — we'll put you in front of local buyers.",
    cta: "Contact Us to Advertise",
    href: "mailto:shahirsha215.s@gmail.com?subject=Advertise on LocalMart",
    emoji: "🚀",
    grad: "from-purple-600 via-fuchsia-600 to-pink-600",
    accent: "#FFCE32",
  },
  {
    id: "grow",
    badge: "⚡ Any Business, Any Type",
    heading: "Mechanics, Salons, Tiffin — We Cover It All",
    sub: "From auto-repairs to home-cooked meals — grow your local business with zero commission. Post free, sell local.",
    cta: "Start Selling Free",
    href: "/listings/new",
    emoji: "🔧",
    grad: "from-emerald-500 via-teal-600 to-cyan-700",
    accent: "#FFCE32",
  },
  {
    id: "featured",
    badge: "⭐ Boost Your Listing",
    heading: "3× More Visibility with Featured",
    sub: "Get to the top of search results in your area. Featured listings get 3× more views and sell faster.",
    cta: "Upgrade to Featured",
    href: "/listings/new",
    emoji: "🌟",
    grad: "from-amber-500 via-yellow-500 to-orange-500",
    accent: "#1a1a1a",
  },
];

const INTERVAL = 4500;

export function AdCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const advance = useCallback((dir: 1 | -1) => {
    setCurrent(c => (c + dir + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => advance(1), INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, advance]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) advance(delta < 0 ? 1 : -1);
    touchStartX.current = null;
  }

  const s = SLIDES[current];

  return (
    <div
      className="relative mx-4 mt-6 rounded-2xl overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: 200 }}
    >
      {/* Slide background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${s.grad} transition-all duration-700`}
      />

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg,rgba(255,255,255,0.3) 0,rgba(255,255,255,0.3) 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,rgba(255,255,255,0.3) 0,rgba(255,255,255,0.3) 1px,transparent 1px,transparent 32px)"
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-4 px-5 py-6 sm:px-8">

        {/* Big emoji */}
        <div className="shrink-0 text-5xl sm:text-6xl leading-none" aria-hidden>
          {s.emoji}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <span
            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 tracking-wide"
            style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}
          >
            {s.badge}
          </span>
          <h3 className="text-white font-black text-base sm:text-xl leading-snug mb-1">
            {s.heading}
          </h3>
          <p className="text-white/75 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-3">
            {s.sub}
          </p>
          <Link
            href={s.href}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: s.accent, color: s.accent === "#FFCE32" ? "#1a1a1a" : "#fff" }}
          >
            {s.cta} →
          </Link>
        </div>
      </div>

      {/* Left arrow */}
      <button
        onClick={() => advance(-1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center h-8 w-8 rounded-full z-20 transition-all hover:scale-110"
        style={{ background: "rgba(255,255,255,0.18)" }}
        aria-label="Previous"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Right arrow */}
      <button
        onClick={() => advance(1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center h-8 w-8 rounded-full z-20 transition-all hover:scale-110"
        style={{ background: "rgba(255,255,255,0.18)" }}
        aria-label="Next"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
        {SLIDES.map((sl, i) => (
          <button
            key={sl.id}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="transition-all"
            style={{
              width: i === current ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === current ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
