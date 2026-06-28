"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Listing {
  id: string;
  title: string;
  vertical: string;
  status: string;
  price: number | null;
  price_unit: string;
  images: string[];
  pin_code: string | null;
  view_count: number;
  contact_count: number;
  submitted_at: string;
  expires_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:   { label: "Active",   color: "status-active" },
  pending:  { label: "Pending",  color: "status-pending" },
  draft:    { label: "Draft",    color: "bg-blue-100 text-blue-700" },
  sold:     { label: "Sold",     color: "status-approved" },
  expired:  { label: "Expired",  color: "bg-gray-100 text-gray-500" },
  rejected: { label: "Rejected", color: "status-rejected" },
};

const VERT_ICON: Record<string, string> = {
  vegetables:"🥬", food:"🍽️", gas:"🔥", construction:"🏗️",
  property:"🏠", rentals:"🏘️", mechanics:"🔧", grocery:"🛒",
  jobs:"💼", vehicles:"🚗", furniture:"🛋️", mobiles:"📱",
};

export default function UserListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { fetchListings(); }, [filter]);

  async function fetchListings() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    let q = supabase
      .from("listings")
      .select("id,title,vertical,status,price,price_unit,images,pin_code,view_count,contact_count,submitted_at,expires_at")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setListings((data as Listing[]) ?? []);
    setLoading(false);
  }

  const counts: Record<string, number> = {};
  for (const l of listings) counts[l.status] = (counts[l.status] ?? 0) + 1;

  const totalViews    = listings.reduce((s, l) => s + (l.view_count ?? 0), 0);
  const totalContacts = listings.reduce((s, l) => s + (l.contact_count ?? 0), 0);

  const daysLeft = (l: Listing) => {
    if (!l.expires_at) return null;
    const diff = Math.round((new Date(l.expires_at).getTime() - Date.now()) / 86400000);
    return diff;
  };

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Listings</h1>
          <p className="text-xs text-gray-500 mt-0.5">{listings.length} total · {totalViews} views · {totalContacts} contacts</p>
        </div>
        <Link href="/listings/new" className="btn-royal text-xs px-4 py-2">+ Post New</Link>
      </div>

      <div className="dash-page">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Active",   value: counts["active"]  ?? 0, color: "border-l-green-500" },
            { label: "Pending",  value: counts["pending"] ?? 0, color: "border-l-amber-500" },
            { label: "Views",    value: totalViews,              color: "border-l-blue-500" },
            { label: "Contacts", value: totalContacts,           color: "border-l-brand-500" },
          ].map(s => (
            <div key={s.label} className={`stat-card border-l-4 ${s.color}`}>
              <div className="text-2xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {["all","active","pending","sold","expired","draft"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-xl border font-semibold capitalize transition-all ${filter === f ? "bg-brand-600 text-white border-brand-600" : "bg-white border-gray-200 text-gray-600 hover:border-brand-300"}`}>
              {f}{f !== "all" && counts[f] ? ` (${counts[f]})` : ""}
            </button>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="card p-10 text-center text-gray-400 text-sm">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 mb-4">No listings yet</p>
            <Link href="/listings/new" className="btn-royal text-sm px-6 py-2.5">Post Your First Listing</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map(l => {
              const sc   = STATUS_CONFIG[l.status] ?? { label: l.status, color: "bg-gray-100 text-gray-600" };
              const img  = (l.images as string[])?.[0];
              const days = daysLeft(l);
              return (
                <div key={l.id} className="card p-4 flex gap-4 items-start">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {img
                      ? <img src={img} alt={l.title} className="w-full h-full object-cover" />
                      : <span className="text-2xl opacity-40">{VERT_ICON[l.vertical] ?? "📦"}</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{l.title}</h3>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {VERT_ICON[l.vertical]} {l.vertical} · PIN {l.pin_code ?? "—"}
                        </div>
                      </div>
                      <span className={`badge shrink-0 ${sc.color}`}>{sc.label}</span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {l.price && (
                        <span className="font-bold text-gray-900">
                          ₹{Number(l.price).toLocaleString("en-IN")}
                          {l.price_unit !== "fixed" && <span className="font-normal text-gray-400">/{l.price_unit?.replace("per_","")}</span>}
                        </span>
                      )}
                      <span>👁 {l.view_count ?? 0}</span>
                      <span>📞 {l.contact_count ?? 0}</span>
                      <span>{new Date(l.submitted_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short" })}</span>
                      {days !== null && l.status === "active" && (
                        <span className={days <= 7 ? "text-red-500 font-semibold" : "text-gray-400"}>
                          ⏳ {days}d left
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Link href={`/listings/${l.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold text-center">
                      View
                    </Link>
                    <Link href={`/dashboard/listings/${l.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg bg-brand-100 text-brand-700 hover:bg-brand-200 font-semibold text-center">
                      Edit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
