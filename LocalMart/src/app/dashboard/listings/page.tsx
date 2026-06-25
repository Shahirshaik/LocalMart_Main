import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ListingStatusBadge } from "@/components/ui/StatusBadge";
import { formatPrice, timeAgo, LISTING_TYPE_LABELS } from "@/lib/utils";
import { Search, Eye } from "lucide-react";
import type { Listing, Village } from "@/types/database";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending",  label: "Pending" },
  { value: "active",   label: "Active" },
  { value: "featured", label: "Featured" },
  { value: "sold",     label: "Sold" },
  { value: "rejected", label: "Rejected" },
];

interface Props {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

export default async function DashboardListingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const page = Number(params.page ?? 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("listings")
    .select("*, village:villages(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.q) query = query.ilike("title", `%${params.q}%`);
  if (params.status) query = query.eq("status", params.status);

  const { data: listings, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / limit);

  const buildUrl = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: params.q, status: params.status, ...extra };
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `/dashboard/listings?${p.toString()}`;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
        <span className="text-sm text-gray-400">{count ?? 0} total</span>
      </div>

      <div className="card p-4 space-y-3">
        <form method="GET" action="/dashboard/listings" className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input name="q" defaultValue={params.q} placeholder="Search by title..." className="input pl-9 text-sm" />
          </div>
          {params.status && <input type="hidden" name="status" value={params.status} />}
          <button type="submit" className="btn-primary px-4 text-sm">Search</button>
        </form>
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <Link key={t.value} href={buildUrl({ status: t.value || undefined, page: undefined })}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                params.status === t.value || (!params.status && !t.value)
                  ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Listing</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Village</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Posted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listings && listings.length > 0 ? (
                (listings as (Listing & { village?: Village })[]).map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">{l.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-gray-100 text-gray-600">{LISTING_TYPE_LABELS[l.type]}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-600 whitespace-nowrap">
                      {formatPrice(l.price, l.price_type)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{(l.village as any)?.name ?? "—"}</td>
                    <td className="px-4 py-3"><ListingStatusBadge status={l.status} /></td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{timeAgo(l.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/listings/${l.id}`}
                        className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                        <Eye className="h-3.5 w-3.5" /> Review
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No listings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <Link href={buildUrl({ page: String(page - 1) })} className="btn-secondary text-sm px-4">Prev</Link>}
          <span className="flex items-center text-sm text-gray-500 px-3">Page {page} / {totalPages}</span>
          {page < totalPages && <Link href={buildUrl({ page: String(page + 1) })} className="btn-secondary text-sm px-4">Next</Link>}
        </div>
      )}
    </div>
  );
}
