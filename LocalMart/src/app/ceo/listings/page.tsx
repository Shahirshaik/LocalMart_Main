import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const VERTICALS = [
  "vegetables","food","gas","construction","property","rentals",
  "mechanics","grocery","jobs","vehicles","furniture","mobiles",
];
const STATUSES = ["pending","active","sold","expired","rejected","draft"];

const STATUS_COLOR: Record<string, string> = {
  pending:  "status-pending",
  active:   "status-active",
  sold:     "status-approved",
  expired:  "bg-gray-100 text-gray-500",
  rejected: "status-rejected",
  draft:    "bg-blue-100 text-blue-700",
};

const VERTICAL_ICON: Record<string, string> = {
  vegetables:"🥬", food:"🍽️", gas:"🔥", construction:"🏗️",
  property:"🏠", rentals:"🏘️", mechanics:"🔧", grocery:"🛒",
  jobs:"💼", vehicles:"🚗", furniture:"🛋️", mobiles:"📱",
};

interface RawListing {
  id: string;
  title: string;
  vertical: string;
  status: string;
  price: number | null;
  price_unit: string | null;
  pin_code: string | null;
  view_count: number;
  contact_count: number;
  submitted_at: string;
  is_featured: boolean;
  users: { full_name: string | null } | null;
  india_districts: { name: string } | null;
}

export default async function CEOListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string; status?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const sp       = await searchParams;
  const vertical = sp.vertical ?? "";
  const status   = sp.status   ?? "";
  const q        = sp.q        ?? "";

  let query = supabase
    .from("listings")
    .select(
      "id,title,vertical,status,price,price_unit,pin_code,view_count,contact_count,submitted_at,is_featured," +
      "users(full_name)," +
      "india_districts(name)"
    )
    .order("submitted_at", { ascending: false })
    .limit(60);

  if (vertical) query = query.eq("vertical", vertical);
  if (status)   query = query.eq("status",   status);

  const { data } = await query;
  const listings = (data ?? []) as unknown as RawListing[];

  const filtered = q
    ? listings.filter(l =>
        l.title?.toLowerCase().includes(q.toLowerCase()) ||
        l.pin_code?.includes(q)
      )
    : listings;

  const counts: Record<string, number> = {};
  for (const l of listings) counts[l.status] = (counts[l.status] ?? 0) + 1;

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Listings</h1>
          <p className="text-xs text-gray-500 mt-0.5">{filtered.length} listings</p>
        </div>
        <Link href="/listings/new" className="btn-royal text-xs px-4 py-2">+ Post Listing</Link>
      </div>

      <div className="dash-page">
        {/* Filters */}
        <div className="card p-4 mb-6 flex flex-wrap gap-3">
          <form className="contents">
            <input name="q" defaultValue={q} placeholder="Search title or PIN..."
              className="flex-1 min-w-48 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" />
            <select name="vertical" defaultValue={vertical}
              className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
              <option value="">All Verticals</option>
              {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select name="status" defaultValue={status}
              className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s} ({counts[s] ?? 0})</option>)}
            </select>
            <button type="submit" className="btn-royal text-xs px-4 py-2">Filter</button>
            <Link href="/ceo/listings" className="text-xs text-gray-500 hover:text-gray-700 flex items-center">Clear</Link>
          </form>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>LISTING</th>
                  <th>VERTICAL</th>
                  <th>STATUS</th>
                  <th>PRICE</th>
                  <th>AREA</th>
                  <th>VIEWS</th>
                  <th>CONTACTS</th>
                  <th>POSTED</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-400 text-sm">
                      No listings found
                    </td>
                  </tr>
                ) : (
                  filtered.map(l => (
                    <tr key={l.id}>
                      <td>
                        <div className="font-medium text-gray-900 text-sm truncate max-w-48">{l.title}</div>
                        <div className="text-xs text-gray-400">{l.users?.full_name ?? "—"}</div>
                      </td>
                      <td>
                        <span className="flex items-center gap-1 text-xs">
                          {VERTICAL_ICON[l.vertical] ?? "📦"} {l.vertical}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${STATUS_COLOR[l.status] ?? "bg-gray-100"}`}>{l.status}</span>
                        {l.is_featured && <span className="badge bg-amber-100 text-amber-700 ml-1">★</span>}
                      </td>
                      <td className="text-sm font-semibold text-gray-900">
                        {l.price ? `₹${Number(l.price).toLocaleString("en-IN")}` : "—"}
                        {l.price_unit && l.price_unit !== "fixed" ? (
                          <span className="text-xs text-gray-400 ml-1 font-normal">/{l.price_unit.replace("per_","")}</span>
                        ) : null}
                      </td>
                      <td className="text-xs text-gray-600">
                        {l.india_districts?.name ?? "—"}
                        {l.pin_code && <div className="text-gray-400">{l.pin_code}</div>}
                      </td>
                      <td className="text-sm text-gray-700">{l.view_count ?? 0}</td>
                      <td className="text-sm text-gray-700">{l.contact_count ?? 0}</td>
                      <td className="text-xs text-gray-400">
                        {new Date(l.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td>
                        <Link href={`/dashboard/listings/${l.id}`}
                          className="text-xs text-brand-600 font-semibold hover:underline">View →</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
