import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import Link from "next/link";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import type { UserRole, ListingFull } from "@/types/database";

const TYPES = [
  { value: "", label: "All" },
  { value: "sell",    label: "For Sale" },
  { value: "buy",     label: "Want to Buy" },
  { value: "rent",    label: "For Rent" },
  { value: "service", label: "Services" },
];

const CATEGORIES = [
  { slug: "agriculture", label: "Agriculture" },
  { slug: "electronics", label: "Electronics" },
  { slug: "vehicles",    label: "Vehicles" },
  { slug: "property",    label: "Property" },
  { slug: "clothing",    label: "Clothing" },
  { slug: "food",        label: "Food" },
  { slug: "furniture",   label: "Furniture" },
  { slug: "services",    label: "Services" },
  { slug: "jobs",        label: "Jobs" },
  { slug: "other",       label: "Other" },
];

interface Props {
  searchParams: Promise<{ q?: string; type?: string; category?: string; village?: string; page?: string }>;
}

export default async function ListingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let userRole: UserRole | null = null;
  if (user) {
    const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
    userRole = data?.role ?? null;
  }

  const page = Number(params.page ?? 1);
  const limit = 24;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("listings")
    .select("*, village:villages(*), category:categories(*)", { count: "exact" })
    .in("status", ["active", "featured"])
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.q)    query = query.ilike("title", `%${params.q}%`);
  if (params.type) query = query.eq("type", params.type);

  if (params.category) {
    const { data: cat } = await supabase
      .from("categories").select("id").eq("slug", params.category).single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  const { data: listings, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / limit);

  const buildUrl = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: params.q, type: params.type, category: params.category, ...extra };
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `/listings?${p.toString()}`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userRole={userRole} userEmail={user?.email} />

      <main className="flex-1 bg-gray-50">
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Browse Listings</h1>
                <p className="text-sm text-gray-500">{count ?? 0} listings found</p>
              </div>
              <Link href="/listings/new" className="btn-primary shrink-0">
                <Plus className="h-4 w-4" /> Post Free
              </Link>
            </div>

            <form method="GET" action="/listings" className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="q" defaultValue={params.q} placeholder="Search listings..."
                  className="input pl-10" />
              </div>
              {params.type && <input type="hidden" name="type" value={params.type} />}
              {params.category && <input type="hidden" name="category" value={params.category} />}
              <button type="submit" className="btn-primary px-5">Search</button>
            </form>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
              {TYPES.map((t) => (
                <Link key={t.value} href={buildUrl({ type: t.value || undefined, page: undefined })}
                  className={"shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors " + (
                    params.type === t.value || (!params.type && !t.value)
                      ? "border-brand-600 text-brand-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}>
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <div className="flex gap-6">
            <aside className="hidden lg:block w-48 shrink-0">
              <div className="card p-4 sticky top-20">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Categories
                </p>
                <ul className="space-y-0.5">
                  <li>
                    <Link href={buildUrl({ category: undefined, page: undefined })}
                      className={"block rounded-lg px-3 py-2 text-sm transition-colors " + (
                        !params.category ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                      )}>
                      All Categories
                    </Link>
                  </li>
                  {CATEGORIES.map((c) => (
                    <li key={c.slug}>
                      <Link href={buildUrl({ category: c.slug, page: undefined })}
                        className={"block rounded-lg px-3 py-2 text-sm transition-colors " + (
                          params.category === c.slug ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                        )}>
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="flex-1">
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                <Link href={buildUrl({ category: undefined, page: undefined })}
                  className={"shrink-0 badge " + (!params.category ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600")}>
                  All
                </Link>
                {CATEGORIES.map((c) => (
                  <Link key={c.slug} href={buildUrl({ category: c.slug, page: undefined })}
                    className={"shrink-0 badge " + (params.category === c.slug ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600")}>
                    {c.label}
                  </Link>
                ))}
              </div>

              {listings && listings.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {(listings as ListingFull[]).map((l, i) => (
                      <ListingCard key={l.id} listing={l} index={i} />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                      {page > 1 && <Link href={buildUrl({ page: String(page - 1) })} className="btn-secondary px-4">Prev</Link>}
                      <span className="flex items-center px-4 text-sm text-gray-500">Page {page} of {totalPages}</span>
                      {page < totalPages && <Link href={buildUrl({ page: String(page + 1) })} className="btn-secondary px-4">Next</Link>}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-24 text-gray-400">
                  <p className="text-5xl mb-4">🔍</p>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No listings found</h3>
                  <p className="text-sm mb-6">Try adjusting your search or filters</p>
                  <Link href="/listings/new" className="btn-primary">Post a Listing</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
