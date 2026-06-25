import Link from "next/link";
import { MapPin, Clock, Eye, Tag } from "lucide-react";
import { formatPrice, timeAgo, CATEGORY_ICONS, LISTING_TYPE_LABELS } from "@/lib/utils";
import type { ListingFull } from "@/types/database";

const TYPE_COLORS: Record<string, string> = {
  sell:    "bg-green-100 text-green-700",
  buy:     "bg-blue-100 text-blue-700",
  rent:    "bg-orange-100 text-orange-700",
  service: "bg-brand-100 text-brand-700",
};

const GRADIENTS = [
  "from-brand-400 to-purple-600",
  "from-blue-400 to-cyan-600",
  "from-green-400 to-emerald-600",
  "from-orange-400 to-amber-600",
  "from-pink-400 to-rose-600",
  "from-indigo-400 to-violet-600",
];

interface Props { listing: ListingFull; index?: number; }

export function ListingCard({ listing, index = 0 }: Props) {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const icon = CATEGORY_ICONS[listing.category?.slug ?? "other"] ?? "\uD83D\uDCE6";

  return (
    <Link href={`/listings/${listing.id}`}
      className="card flex flex-col overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all">
      {/* Image / gradient placeholder */}
      <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
        {listing.images?.[0] ? (
          <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-5xl opacity-80 group-hover:scale-110 transition-transform">{icon}</span>
        )}
        <span className={`absolute top-3 left-3 badge ${TYPE_COLORS[listing.type] ?? "bg-white text-gray-700"}`}>
          {LISTING_TYPE_LABELS[listing.type]}
        </span>
        {listing.status === "featured" && (
          <span className="absolute top-3 right-3 badge bg-yellow-400 text-yellow-900">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug">
          {listing.title}
        </h3>

        <p className="text-lg font-bold text-brand-600">
          {formatPrice(listing.price, listing.price_type)}
          {listing.price_type === "negotiable" && (
            <span className="ml-1 text-xs font-normal text-gray-400">negotiable</span>
          )}
        </p>

        <div className="mt-auto space-y-1.5">
          {(listing.area || listing.city || listing.district || listing.state || listing.village) && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="h-3 w-3 shrink-0 text-brand-400" />
              <span className="truncate">
                {[listing.area || listing.village?.name, listing.city, listing.district || listing.village?.region, listing.state || listing.village?.state]
                  .filter(Boolean).slice(0, 3).join(", ")}
              </span>
            </div>
          )}
          {listing.category && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Tag className="h-3 w-3 shrink-0 text-brand-400" />
              <span className="truncate">{listing.category.name_en ?? listing.category.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(listing.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {listing.view_count ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
