"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Heart } from "lucide-react";
import { formatPrice, timeAgo, CATEGORY_ICONS } from "@/lib/utils";
import type { ListingFull } from "@/types/database";

const GRADIENTS = [
  "from-purple-100 to-purple-200",
  "from-blue-100 to-blue-200",
  "from-green-100 to-green-200",
  "from-orange-100 to-orange-200",
  "from-pink-100 to-rose-100",
  "from-indigo-100 to-violet-200",
];

interface Props { listing: ListingFull; index?: number; }

function ListingImage({ src, alt, gradient, icon }: {
  src: string; alt: string; gradient: string; icon: string;
}) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-5xl opacity-60">{icon}</span>
      </div>
    );
  }
  return (
    <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setError(true)} />
  );
}

export function ListingCard({ listing, index = 0 }: Props) {
  const [saved, setSaved] = useState(false);
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const icon = CATEGORY_ICONS[listing.category?.slug ?? "other"] ?? "📦";

  const location = [
    listing.area || listing.village?.name,
    listing.city,
    listing.district || listing.village?.region,
  ].filter(Boolean).slice(0, 2).join(", ") || listing.state || "India";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow border border-[#e0e0e0]"
    >
      {/* Image — fixed 180px height */}
      <div className="relative w-full overflow-hidden bg-gray-100" style={{ height: 180 }}>
        {listing.images?.[0] ? (
          <ListingImage src={listing.images[0]} alt={listing.title} gradient={gradient} icon={icon} />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-5xl opacity-60">{icon}</span>
          </div>
        )}

        {/* FEATURED badge — top left */}
        {listing.status === "featured" && (
          <span
            className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold"
            style={{ background: "#FFCE32", color: "#333" }}
          >
            FEATURED
          </span>
        )}

        {/* Heart save — top right */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setSaved(s => !s); }}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        >
          <Heart
            className="h-4 w-4"
            style={{ color: saved ? "#ef4444" : "#9ca3af" }}
            fill={saved ? "#ef4444" : "none"}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-2.5">
        <p className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug">{listing.title}</p>
        <p className="font-bold text-base mt-1" style={{ color: "#333" }}>
          {formatPrice(listing.price, listing.price_type)}
          {listing.price_type === "negotiable" && (
            <span className="ml-1 text-xs font-normal text-gray-400">negotiable</span>
          )}
        </p>
        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{location}</span>
          <span className="mx-1">·</span>
          <span className="shrink-0">{timeAgo(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
