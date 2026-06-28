"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Sparkles, Clock, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Listing {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  created_at: string;
  category?: string | null;
  is_featured?: boolean;
}

const PLACEHOLDER_GRADIENTS = [
  "from-purple-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-amber-500",
  "from-pink-400 to-rose-500",
  "from-blue-400 to-cyan-500",
  "from-violet-400 to-purple-500",
  "from-lime-400 to-green-500",
  "from-red-400 to-orange-500",
];

const CATEGORY_EMOJIS: Record<string, string> = {
  vegetables: "🥦", restaurants: "🍱", gas: "🔴", construction: "🏗️",
  land: "🏠", rentals: "🛋️", mechanics: "🔧", electronics: "📱",
  jobs: "💼", fashion: "👗", health: "🩺", education: "📚",
};

function relativeTime(dateStr: string, t: (k: string, v?: Record<string, string | number>) => string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t("feed.just_now");
  if (mins < 60) return t("feed.minutes_ago", { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("feed.hours_ago", { n: hrs });
  return t("feed.days_ago", { n: Math.floor(hrs / 24) });
}

function formatPrice(price: number | null): string {
  if (!price) return "Free";
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`;
  return `₹${price.toLocaleString("en-IN")}`;
}

interface RecommendationsFeedProps {
  listings?: Listing[];
  title?: string;
}

export default function RecommendationsFeed({ listings = [], title }: RecommendationsFeedProps) {
  const { t } = useI18n();
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  function toggleWishlist(id: string, e: React.MouseEvent) {
    e.preventDefault();
    setWishlisted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Pad with placeholder cards if few real listings
  const displayListings = listings.length > 0 ? listings : [];
  const placeholders = Math.max(0, 8 - displayListings.length);

  return (
    <section className="py-6">
      <div className="flex items-baseline justify-between mb-4 px-1">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title ?? t("feed.title")}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t("feed.subtitle")}</p>
        </div>
        {listings.length > 0 && (
          <Link href="/user/all-listings" className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">
            {t("feed.view_all")} →
          </Link>
        )}
      </div>

      {displayListings.length === 0 && placeholders === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{t("feed.no_listings")}</p>
          <Link href="/user/post-ad" className="mt-3 inline-block text-sm font-semibold text-purple-600">
            {t("nav.post_free_ad")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {displayListings.map((listing, i) => {
            const gradient = PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length];
            const emoji = CATEGORY_EMOJIS[listing.category ?? ""] ?? "🏷️";
            const isWishlisted = wishlisted.has(listing.id);

            return (
              <Link
                key={listing.id}
                href={`/user/listing/${listing.id}`}
                className="group relative rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                {/* Image / placeholder */}
                <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <span className="text-4xl">{emoji}</span>

                  {/* Wishlist */}
                  <button
                    onClick={(e) => toggleWishlist(listing.id, e)}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                  >
                    <Heart
                      className={`h-3.5 w-3.5 transition-colors ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                    />
                  </button>

                  {/* Featured / AI Pick badge */}
                  {listing.is_featured && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white bg-amber-500">
                      <Star className="h-2.5 w-2.5" />
                      {t("feed.featured")}
                    </span>
                  )}
                  {i < 3 && !listing.is_featured && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white bg-purple-600">
                      <Sparkles className="h-2.5 w-2.5" />
                      {t("feed.ai_pick")}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-3">
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{listing.title}</p>
                  <p className="text-base font-extrabold mt-0.5" style={{ color: "#3B0764" }}>
                    {listing.price ? formatPrice(listing.price) : (
                      <span className="text-green-600">{t("common.free")}</span>
                    )}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    {listing.location && (
                      <span className="flex items-center gap-0.5 text-[11px] text-gray-400 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{listing.location}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 text-[11px] text-gray-400 shrink-0 ml-auto">
                      <Clock className="h-3 w-3" />
                      {relativeTime(listing.created_at, t)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Placeholder skeleton cards when no real data */}
          {Array.from({ length: placeholders }).map((_, i) => {
            const gradient = PLACEHOLDER_GRADIENTS[(displayListings.length + i) % PLACEHOLDER_GRADIENTS.length];
            const emojis = ["🚗", "📱", "🏠", "👗", "🔧", "💻", "🛒", "🧴"];
            const titles = [
              "Honda City 2020 – Excellent Condition",
              "iPhone 14 Pro 256GB – Like New",
              "2BHK Flat for Rent – Hyderabad",
              "Saree Collection – Brand New",
              "AC Repair & Service",
              "Dell Laptop – Core i7",
              "Grocery Delivery – Same Day",
              "Organic Skincare Products",
            ];
            const prices = ["₹7.5L", "₹68,000", "₹22K/mo", "₹1,200", "₹500", "₹45,000", "₹Free", "₹899"];
            const locs = ["Hyderabad", "Mumbai", "Bangalore", "Chennai", "Delhi", "Pune", "Kolkata", "Ahmedabad"];

            return (
              <div
                key={`ph-${i}`}
                className="group relative rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
                onClick={() => {}}
              >
                <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <span className="text-4xl">{emojis[i % emojis.length]}</span>
                  <button className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                    <Heart className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                  {i < 2 && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white bg-purple-600">
                      <Sparkles className="h-2.5 w-2.5" />
                      {t("feed.ai_pick")}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{titles[i % titles.length]}</p>
                  <p className="text-base font-extrabold mt-0.5" style={{ color: "#3B0764" }}>
                    {prices[i % prices.length]}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="flex items-center gap-0.5 text-[11px] text-gray-400 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{locs[i % locs.length]}</span>
                    </span>
                    <span className="flex items-center gap-0.5 text-[11px] text-gray-400 shrink-0 ml-auto">
                      <Clock className="h-3 w-3" />
                      {i + 1}d ago
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
