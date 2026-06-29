"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

const RECENT_KEY = "lm_recent_viewed";

export function trackListingView(id: string) {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    const ids: string[] = stored ? JSON.parse(stored) : [];
    const updated = [id, ...ids.filter(x => x !== id)].slice(0, 10);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

interface RecentListing {
  id: string;
  title: string;
  price: number | null;
  price_type: string;
  images: string[] | null;
  area: string | null;
  city: string | null;
}

export function RecentlyViewed() {
  const [listings, setListings] = useState<RecentListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const stored = localStorage.getItem(RECENT_KEY);
        if (!stored) { setLoading(false); return; }
        const ids: string[] = JSON.parse(stored);
        if (!ids.length) { setLoading(false); return; }

        const supabase = createClient();
        const { data } = await supabase
          .from("listings")
          .select("id,title,price,price_type,images,area,city")
          .in("id", ids)
          .limit(10);

        if (data?.length) {
          const ordered = ids
            .map(id => data.find((l: RecentListing) => l.id === id))
            .filter(Boolean) as RecentListing[];
          setListings(ordered);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !listings.length) return null;

  return (
    <section className="bg-white mt-2 py-4">
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="text-sm font-bold text-gray-900">Recently Viewed</h2>
        <Link href="/listings" className="text-xs font-medium" style={{ color: "#7C3AED" }}>
          View All
        </Link>
      </div>
      <div className="overflow-x-auto no-scrollbar px-4">
        <div className="flex gap-3">
          {listings.map(l => (
            <Link
              key={l.id}
              href={`/listings/${l.id}`}
              className="shrink-0 bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              style={{ width: 150 }}
            >
              <div className="w-full bg-gray-100" style={{ height: 130 }}>
                {l.images?.[0] ? (
                  <img
                    src={l.images[0]}
                    alt={l.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-purple-100 to-purple-200">
                    📦
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">{l.title}</p>
                <p className="text-sm font-bold mt-1 text-gray-800">
                  {formatPrice(l.price, l.price_type)}
                </p>
                {(l.area || l.city) && (
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                    {[l.area, l.city].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
