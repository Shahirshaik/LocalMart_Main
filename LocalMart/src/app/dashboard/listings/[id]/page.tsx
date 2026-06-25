"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ListingStatusBadge } from "@/components/ui/StatusBadge";
import { formatPrice, timeAgo, LISTING_TYPE_LABELS } from "@/lib/utils";
import { ArrowLeft, CheckCircle, XCircle, Star, Phone, MessageCircle, Eye } from "lucide-react";
import type { ListingFull } from "@/types/database";

type Status = "pending" | "active" | "featured" | "sold" | "rejected";

const ACTIONS: { status: Status; label: string; icon: React.ElementType; color: string }[] = [
  { status: "active",   label: "Approve",  icon: CheckCircle, color: "bg-green-600 hover:bg-green-700 text-white" },
  { status: "featured", label: "Feature",  icon: Star,        color: "bg-yellow-500 hover:bg-yellow-600 text-white" },
  { status: "rejected", label: "Reject",   icon: XCircle,     color: "bg-red-600 hover:bg-red-700 text-white" },
  { status: "sold",     label: "Mark Sold",icon: CheckCircle, color: "bg-gray-600 hover:bg-gray-700 text-white" },
];

export default function DashboardListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [listing, setListing] = useState<ListingFull & { seller?: { full_name: string; phone: string; email: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase
      .from("listings")
      .select("*, village:villages(*), category:categories(*), seller:users!seller_id(full_name, phone, email)")
      .eq("id", id)
      .single()
      .then(({ data }) => { setListing(data as any); setLoading(false); });
  }, [id]);

  const updateStatus = async (status: Status) => {
    setUpdating(true);
    await supabase.from("listings").update({ status }).eq("id", id);
    setMsg(`Status updated to "${status}"`);
    setListing((l) => l ? { ...l, status } : l);
    setUpdating(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  if (!listing) return <div className="text-center py-20 text-gray-400">Listing not found</div>;

  const l = listing;
  const phone = l.contact_phone || (l as any).seller?.phone;
  const whatsapp = l.whatsapp_number || phone;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/listings" className="btn-ghost p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{l.title}</h1>
          <p className="text-xs text-gray-400">ID: {l.id}</p>
        </div>
        <ListingStatusBadge status={l.status} />
      </div>

      {msg && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card overflow-hidden">
            {l.images?.[0] ? (
              <img src={l.images[0]} alt={l.title} className="w-full h-56 object-cover" />
            ) : (
              <div className="h-40 bg-gradient-to-br from-brand-400 to-purple-600 flex items-center justify-center">
                <span className="text-5xl">📦</span>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Listing Details</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-400">Type</dt><dd className="font-medium text-gray-900">{LISTING_TYPE_LABELS[l.type]}</dd></div>
              <div><dt className="text-gray-400">Price</dt><dd className="font-bold text-brand-600">{formatPrice(l.price, l.price_type)}</dd></div>
              <div><dt className="text-gray-400">Category</dt><dd className="font-medium text-gray-900">{l.category?.name_en ?? l.category?.name ?? "—"}</dd></div>
              <div><dt className="text-gray-400">Village</dt><dd className="font-medium text-gray-900">{l.village?.name ?? "—"}</dd></div>
              <div><dt className="text-gray-400">Posted</dt><dd className="font-medium text-gray-900">{timeAgo(l.created_at)}</dd></div>
              <div><dt className="text-gray-400">Views</dt><dd className="font-medium text-gray-900">{l.view_count}</dd></div>
            </dl>
            {l.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{l.description}</p>
              </div>
            )}
            {l.tags && l.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {l.tags.map((tag) => <span key={tag} className="badge bg-gray-100 text-gray-600">#{tag}</span>)}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Seller Info</h2>
            <p className="text-sm font-medium text-gray-900">{(l as any).seller?.full_name ?? "—"}</p>
            <p className="text-xs text-gray-400 mt-0.5">{(l as any).seller?.email ?? "—"}</p>
            <div className="mt-3 flex gap-2">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium">
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
              )}
              {whatsapp && (
                <a href={`https://wa.me/${String(whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Change Status</h2>
            <div className="grid grid-cols-2 gap-2">
              {ACTIONS.map(({ status, label, icon: Icon, color }) => (
                <button key={status} onClick={() => updateStatus(status)}
                  disabled={updating || l.status === status}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all disabled:opacity-40 ${color}`}>
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          <Link href={`/listings/${l.id}`} target="_blank"
            className="btn-secondary w-full justify-center text-sm">
            <Eye className="h-4 w-4" /> View Public Page
          </Link>
        </div>
      </div>
    </div>
  );
}
