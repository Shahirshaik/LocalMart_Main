"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown, Heart, Bell, Globe } from "lucide-react";
import { LocationPickerModal } from "@/components/ui/LocationPickerModal";
import { useI18n, LANGUAGES, type LangCode } from "@/lib/i18n";

const RECENT_SEARCH_KEY = "lm_recent_searches";
const LOCATION_KEY = "lm_location";

const QUICK_SUGGESTIONS = [
  "Bikes", "Cars", "Property", "Mobiles", "Jobs",
  "Electronics", "Vegetables", "Furniture", "Fashion", "Tiffin",
];

interface Props {
  unreadNotifications?: number;
  unreadWishlist?: number;
}

export function OLXHeader({ unreadNotifications = 0, unreadWishlist = 0 }: Props) {
  const router = useRouter();
  const { lang, setLang } = useI18n();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [locationLabel, setLocationLabel] = useState("India");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCH_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
    try {
      const loc = localStorage.getItem(LOCATION_KEY);
      if (loc) {
        const parsed = JSON.parse(loc);
        const parts = [parsed.area, parsed.city, parsed.district, parsed.state].filter(Boolean);
        if (parts.length > 0) setLocationLabel(parts.slice(0, 2).join(", "));
      }
    } catch {}
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangPicker(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function saveSearch(term: string) {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    try { localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(updated)); } catch {}
  }

  function doSearch(term = query) {
    const q = term.trim();
    if (!q) return;
    saveSearch(q);
    setShowSuggestions(false);
    router.push(`/listings?q=${encodeURIComponent(q)}`);
  }

  const suggestions = query
    ? QUICK_SUGGESTIONS.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : [];

  function handleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "en-IN";
    r.onstart = () => setListening(true);
    r.onend   = () => setListening(false);
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setQuery(text);
      doSearch(text);
    };
    r.start();
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-[#e0e0e0]"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="px-4 py-2.5">

          {/* ROW 1 — mobile only: Logo + Location */}
          <div className="flex items-center justify-between mb-2.5 md:hidden">
            <Link href="/" className="shrink-0">
              <span className="text-2xl font-black tracking-tight" style={{ color: "#3B0764" }}>
                Local<span style={{ color: "#7C3AED" }}>Mart</span>
              </span>
            </Link>
            <button
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-700 min-h-[44px] px-1"
            >
              <MapPin className="h-4 w-4 shrink-0" style={{ color: "#7C3AED" }} />
              <span className="max-w-[150px] truncate">{locationLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>

          {/* ROW 2 (mobile) / SINGLE ROW (desktop) */}
          <div className="flex items-center gap-2">

            {/* Desktop-only logo */}
            <Link href="/" className="hidden md:flex shrink-0 mr-1">
              <span className="text-xl font-black tracking-tight" style={{ color: "#3B0764" }}>
                Local<span style={{ color: "#7C3AED" }}>Mart</span>
              </span>
            </Link>

            {/* Search bar */}
            <div className="relative flex-1">
              <div className="flex items-center rounded-lg border border-[#cccccc] bg-[#f5f5f5]">
                <Search className="h-4 w-4 ml-3 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder={`Search "Bikes, Rooms, Cars..."`}
                  className="flex-1 px-2 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 placeholder:italic outline-none min-w-0"
                  style={{ height: 44 }}
                />
                <button
                  onClick={handleVoice}
                  className="px-3 h-full flex items-center shrink-0"
                  title={listening ? "Listening…" : "Voice search"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke={listening ? "#ef4444" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={listening ? "animate-pulse" : ""}>
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
                  </svg>
                </button>
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && (recentSearches.length > 0 || suggestions.length > 0) && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                >
                  {recentSearches.length > 0 && !query && (
                    <div>
                      <p className="px-3 pt-2.5 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Recent Searches
                      </p>
                      {recentSearches.map(s => (
                        <button
                          key={s}
                          onClick={() => { setQuery(s); doSearch(s); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 min-h-[44px] text-left"
                        >
                          <Search className="h-3.5 w-3.5 text-gray-400" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {suggestions.length > 0 && (
                    <div>
                      <p className="px-3 pt-2.5 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Suggestions
                      </p>
                      {suggestions.map(c => (
                        <button
                          key={c}
                          onClick={() => { setQuery(c); doSearch(c); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 min-h-[44px] text-left"
                        >
                          <Search className="h-3.5 w-3.5 text-gray-400" />
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop: Location button */}
            <button
              onClick={() => setShowLocationPicker(true)}
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-3 shrink-0 hover:border-purple-300 transition-colors"
              style={{ height: 44 }}
            >
              <MapPin className="h-4 w-4 shrink-0" style={{ color: "#7C3AED" }} />
              <span className="max-w-[130px] truncate">{locationLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {/* Heart */}
            <Link
              href="/user/wishlist"
              className="relative flex items-center justify-center shrink-0 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ width: 44, height: 44 }}
            >
              <Heart className="h-5 w-5 text-gray-600" />
              {unreadWishlist > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadWishlist}
                </span>
              )}
            </Link>

            {/* Bell */}
            <Link
              href="/user/notifications"
              className="relative flex items-center justify-center shrink-0 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ width: 44, height: 44 }}
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </Link>

            {/* Language picker */}
            <div ref={langRef} className="relative shrink-0">
              <button
                onClick={() => setShowLangPicker(p => !p)}
                className="flex items-center gap-1 rounded-lg hover:bg-gray-100 transition-colors px-2"
                style={{ height: 44 }}
                title="Switch language"
              >
                <Globe className="h-4 w-4 text-gray-600" />
                <span className="text-xs font-bold text-gray-700 uppercase">{lang}</span>
              </button>
              {showLangPicker && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code as LangCode); setShowLangPicker(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                        lang === l.code ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span className="flex-1">{l.label}</span>
                      <span className="text-xs text-gray-400">{l.native}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showLocationPicker && (
        <LocationPickerModal
          onClose={() => setShowLocationPicker(false)}
          onSelect={label => {
            setLocationLabel(label);
            setShowLocationPicker(false);
          }}
        />
      )}
    </>
  );
}
