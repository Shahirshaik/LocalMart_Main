"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type DetectState = "idle" | "detecting" | "detected" | "error";

const QUICK_SEARCHES = [
  "🥬 Fresh Tomatoes",
  "🔧 Bike Mechanic",
  "🏠 2BHK Flat Rent",
  "🛒 Rice & Dal",
  "💼 Factory Jobs",
];

const SUGGESTIONS: Record<string, { label: string; slug: string; icon: string }[]> = {
  veg:  [{ label: "Vegetables & Fruits", slug: "vegetables", icon: "🥬" }],
  food: [{ label: "Restaurants & Tiffin", slug: "food", icon: "🍽️" }],
  gas:  [{ label: "Gas & Cylinder", slug: "gas", icon: "🔥" }],
  land: [{ label: "Land & Home Sale", slug: "property", icon: "🏠" }],
  flat: [{ label: "House Rentals", slug: "rentals", icon: "🏘️" }],
  rent: [{ label: "House Rentals", slug: "rentals", icon: "🏘️" }],
  bike: [{ label: "Car & Bike Mechanic", slug: "mechanics", icon: "🔧" }],
  car:  [{ label: "Car & Bike Mechanic", slug: "mechanics", icon: "🔧" }, { label: "Buy & Sell Vehicles", slug: "vehicles", icon: "🚗" }],
  job:  [{ label: "Local Jobs", slug: "jobs", icon: "💼" }],
  rice: [{ label: "Grocery & Kirana", slug: "grocery", icon: "🛒" }],
};

export default function HeroSearch() {
  const router    = useRouter();
  const inputRef  = useRef<HTMLInputElement>(null);

  const [query,    setQuery]    = useState("");
  const [pin,      setPin]      = useState("");
  const [detect,   setDetect]   = useState<DetectState>("idle");
  const [city,     setCity]     = useState("");
  const [showSugg, setShowSugg] = useState(false);
  const [ticker,   setTicker]   = useState(0);
  const [pinError, setPinError] = useState(false);

  // Rotate quick-search placeholder
  useEffect(() => {
    const t = setInterval(() => setTicker(n => (n + 1) % QUICK_SEARCHES.length), 2400);
    return () => clearInterval(t);
  }, []);

  // Auto-detect on mount
  useEffect(() => {
    autoDetect();
  }, []);

  function autoDetect() {
    if (!navigator.geolocation) return;
    setDetect("detecting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Nominatim reverse geocode (free, no key needed)
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address ?? {};
          const detectedPin = addr.postcode?.replace(/\s/g, "") ?? "";
          const detectedCity =
            addr.city ?? addr.town ?? addr.village ?? addr.county ?? "Your area";

          setCity(detectedCity);
          if (/^\d{6}$/.test(detectedPin)) {
            setPin(detectedPin);
            setDetect("detected");
          } else {
            setDetect("error"); // location found, PIN not available
          }
        } catch {
          setDetect("error");
        }
      },
      () => setDetect("error"),
      { timeout: 8000, maximumAge: 300_000 }
    );
  }

  function getSuggestions() {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    for (const [key, items] of Object.entries(SUGGESTIONS)) {
      if (lower.includes(key)) return items;
    }
    return [];
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (pin && !/^\d{6}$/.test(pin)) { setPinError(true); return; }
    const params = new URLSearchParams();
    if (query.trim()) params.set("q",   query.trim());
    if (pin.trim())   params.set("pin", pin.trim());
    router.push(`/user/browse?${params}`);
  }

  function handlePinInput(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
    setPinError(false);
  }

  const suggestions = getSuggestions();

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* ── Location pill ── */}
      <div className="flex justify-center mb-5">
        {detect === "detecting" && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.12)", color: "#C4B5FD", border: "1px solid rgba(167,139,250,0.3)" }}>
            <span className="h-3 w-3 rounded-full border-2 border-purple-300 border-t-transparent animate-spin" />
            Detecting your location...
          </div>
        )}
        {detect === "detected" && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(16,185,129,0.15)", color: "#6EE7B7", border: "1px solid rgba(16,185,129,0.3)" }}>
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            📍 {city} · PIN {pin}
            <button onClick={() => { setPin(""); setDetect("idle"); }} className="ml-1 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}
        {detect === "error" && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer"
            style={{ background: "rgba(255,255,255,0.08)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)" }}
            onClick={autoDetect}>
            📍 Location not detected — <span className="underline">retry</span> or enter PIN below
          </div>
        )}
      </div>

      {/* ── Main search card ── */}
      <form onSubmit={handleSearch}
        className="relative rounded-2xl shadow-2xl overflow-visible"
        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)" }}>
        {/* Upper row: keyword search */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100">
          <svg className="h-5 w-5 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSugg(true); }}
            onFocus={() => setShowSugg(true)}
            onBlur={() => setTimeout(() => setShowSugg(false), 200)}
            placeholder={QUICK_SEARCHES[ticker]}
            className="flex-1 text-gray-800 text-base placeholder:text-gray-400 outline-none bg-transparent font-medium"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
          )}
        </div>

        {/* Lower row: PIN input + submit */}
        <div className="flex items-center gap-2 px-4 py-3">
          <div className={`flex items-center gap-2 flex-1 border rounded-xl px-3 py-2 transition-colors ${pinError ? "border-red-300 bg-red-50" : "border-gray-200 focus-within:border-purple-400"}`}>
            <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input
              type="text"
              value={pin}
              onChange={e => handlePinInput(e.target.value)}
              placeholder="PIN Code (e.g. 500032)"
              inputMode="numeric"
              className="flex-1 text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent w-36"
            />
            {detect !== "detecting" && (
              <button type="button" onClick={autoDetect}
                className="text-xs font-semibold shrink-0 transition-colors"
                style={{ color: "#7C3AED" }}>
                {detect === "detected" ? "Re-detect" : "📍 Detect"}
              </button>
            )}
          </div>

          <button type="submit"
            className="shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #4C1D95, #7C3AED)", boxShadow: "0 4px 14px rgba(124,58,237,0.4)" }}>
            Search
          </button>
        </div>

        {pinError && (
          <p className="px-4 pb-3 text-xs text-red-500">Please enter a valid 6-digit PIN code.</p>
        )}

        {/* ── Autocomplete suggestions ── */}
        {showSugg && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
            <div className="px-4 py-2 text-xs text-gray-400 font-medium border-b border-gray-50">Categories matching "{query}"</div>
            {suggestions.map(s => (
              <button key={s.slug} type="button"
                onClick={() => { router.push(`/user/browse?category=${s.slug}${pin ? `&pin=${pin}` : ""}`); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left">
                <span className="text-xl">{s.icon}</span>
                <span className="text-sm font-semibold text-gray-800">{s.label}</span>
                <span className="ml-auto text-xs text-purple-600 font-medium">Browse →</span>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* ── Quick vertical pills ── */}
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {[
          { label: "Vegetables", slug: "vegetables", icon: "🥬" },
          { label: "Tiffin",     slug: "food",       icon: "🍽️" },
          { label: "Gas",        slug: "gas",        icon: "🔥" },
          { label: "Property",   slug: "property",   icon: "🏠" },
          { label: "Mechanics",  slug: "mechanics",  icon: "🔧" },
          { label: "Jobs",       slug: "jobs",       icon: "💼" },
        ].map(v => (
          <button key={v.slug}
            onClick={() => router.push(`/user/browse?category=${v.slug}${pin ? `&pin=${pin}` : ""}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 hover:text-white hover:bg-white/20 transition-all"
            style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
