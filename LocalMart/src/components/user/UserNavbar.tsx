"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, ChevronDown, ShoppingBag, MessageCircle,
  Heart, User, Settings, LogOut, Bell, Plus, Bot
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { createClient } from "@/lib/supabase/client";

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

interface UserNavbarProps {
  userName?: string | null;
  unreadMessages?: number;
  unreadNotifications?: number;
}

export default function UserNavbar({
  userName,
  unreadMessages = 0,
  unreadNotifications = 0,
}: UserNavbarProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("India");
  const [locationOpen, setLocationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const locationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setLocationOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/user/search?q=${encodeURIComponent(query.trim())}`);
  }

  function detectLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(() => {
      setLocation("My Location");
      setLocationOpen(false);
    });
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <header
      className="sticky top-0 z-40 bg-white border-b border-gray-200"
      style={{ boxShadow: "0 1px 8px rgba(59,7,100,0.06)" }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 max-w-screen-2xl mx-auto">

        {/* Logo */}
        <Link href="/user" className="flex items-center gap-2 shrink-0 mr-1">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg,#3B0764,#7C3AED)" }}
          >
            <ShoppingBag className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:block text-base font-extrabold" style={{ color: "#3B0764" }}>
            Local<span style={{ color: "#7C3AED" }}>Mart</span>
          </span>
        </Link>

        {/* Location picker */}
        <div ref={locationRef} className="relative shrink-0">
          <button
            onClick={() => setLocationOpen((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-gray-200 hover:border-purple-300 text-sm font-medium text-gray-700 transition-colors max-w-[130px]"
          >
            <MapPin className="h-3.5 w-3.5 text-purple-600 shrink-0" />
            <span className="truncate hidden sm:inline">{location}</span>
            <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
          </button>

          {locationOpen && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <button
                  onClick={detectLocation}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  {t("nav.location_auto")}
                </button>
                <div className="mt-2 flex gap-2">
                  <input
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={t("nav.location_by_pin")}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                  />
                  <button
                    onClick={() => { if (pinInput.length === 6) { setLocation(pinInput); setLocationOpen(false); } }}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                    style={{ background: "#7C3AED" }}
                  >
                    Go
                  </button>
                </div>
              </div>
              <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t("nav.location_by_state")}
              </p>
              <div className="max-h-52 overflow-y-auto pb-2">
                {INDIA_STATES.map((state) => (
                  <button
                    key={state}
                    onClick={() => { setLocation(state); setLocationOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      location === state ? "bg-purple-50 text-purple-700 font-medium" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 flex min-w-0">
          <div className="relative w-full">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.search_placeholder")}
              className="w-full pl-4 pr-10 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-sm transition-colors bg-gray-50 focus:bg-white"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-full px-3 rounded-r-xl flex items-center justify-center transition-colors"
              style={{ background: "#3B0764" }}
            >
              <Search className="h-4 w-4 text-white" />
            </button>
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Post free ad */}
          <Link
            href="/user/post-ad"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-colors"
            style={{ borderColor: "#F59E0B", color: "#B45309" }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">SELL</span>
          </Link>

          {/* Chat inbox */}
          <Link href="/user/inbox" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" title={t("nav.inbox")}>
            <MessageCircle className="h-5 w-5 text-gray-600" />
            {unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full text-white text-[10px] font-bold"
                style={{ background: "#7C3AED" }}>
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <Link href="/user/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Notifications">
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full text-white text-[10px] font-bold"
                style={{ background: "#EF4444" }}>
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </Link>

          {/* Profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: "linear-gradient(135deg,#3B0764,#7C3AED)" }}
              >
                {initials}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm">{userName ?? "My Account"}</p>
                  <p className="text-xs text-gray-500">LocalMart Member</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  {[
                    { href: "/user/inbox",    icon: MessageCircle, label: t("nav.inbox"),    badge: unreadMessages },
                    { href: "/user/wishlist", icon: Heart,         label: t("nav.wishlist"), badge: 0 },
                    { href: "/user/my-ads",   icon: ShoppingBag,   label: t("nav.my_ads"),  badge: 0 },
                    { href: "/user/profile",  icon: User,          label: t("nav.profile"), badge: 0 },
                    { href: "/user/settings", icon: Settings,      label: t("nav.settings"),badge: 0 },
                  ].map(({ href, icon: Icon, label, badge }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-gray-400" />
                      <span className="flex-1">{label}</span>
                      {badge > 0 && (
                        <span className="h-5 min-w-5 px-1 flex items-center justify-center rounded-full text-white text-[10px] font-bold"
                          style={{ background: "#7C3AED" }}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                {/* Language switcher */}
                <div className="border-t border-gray-100 pt-1">
                  <LanguageSwitcher compact={false} onClose={() => setProfileOpen(false)} />
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.logout")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
