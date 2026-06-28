import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const VERTICALS = [
  { slug:"vegetables", icon:"🥬", label:"Vegetables & Fruits", color:"bg-green-50 border-green-200 text-green-700" },
  { slug:"food",       icon:"🍽️", label:"Restaurants & Tiffin",color:"bg-orange-50 border-orange-200 text-orange-700" },
  { slug:"gas",        icon:"🔥", label:"Gas & Cylinder",       color:"bg-red-50 border-red-200 text-red-700" },
  { slug:"construction",icon:"🏗️",label:"Construction",         color:"bg-amber-50 border-amber-200 text-amber-700" },
  { slug:"property",   icon:"🏠", label:"Land & Home Sale",     color:"bg-purple-50 border-purple-200 text-purple-700" },
  { slug:"rentals",    icon:"🏘️", label:"House Rentals",        color:"bg-blue-50 border-blue-200 text-blue-700" },
  { slug:"mechanics",  icon:"🔧", label:"Car & Bike Mechanic",  color:"bg-slate-50 border-slate-200 text-slate-700" },
  { slug:"grocery",    icon:"🛒", label:"Grocery & Kirana",     color:"bg-yellow-50 border-yellow-200 text-yellow-700" },
  { slug:"jobs",       icon:"💼", label:"Local Jobs",           color:"bg-indigo-50 border-indigo-200 text-indigo-700" },
  { slug:"vehicles",   icon:"🚗", label:"Buy & Sell Vehicles",  color:"bg-cyan-50 border-cyan-200 text-cyan-700" },
  { slug:"furniture",  icon:"🛋️", label:"Furniture & Home",     color:"bg-rose-50 border-rose-200 text-rose-700" },
  { slug:"mobiles",    icon:"📱", label:"Electronics",          color:"bg-violet-50 border-violet-200 text-violet-700" },
];

interface RawListing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  price_unit: string | null;
  is_negotiable: boolean;
  images: string[] | null;
  pin_code: string | null;
  vertical: string;
  address_line: string | null;
  submitted_at: string;
  is_featured: boolean;
  users: { full_name: string | null } | null;
  india_districts: { name: string } | null;
}

export default async function UserBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; pin?: string; max_price?: string }>;
}) {
  const supabase = await createClient();
  const sp       = await searchParams;
  const category = sp.category  ?? "";
  const q        = sp.q         ?? "";
  const pin      = sp.pin       ?? "";
  const maxPrice = sp.max_price ? Number(sp.max_price) : 0;

  let query = supabase
    .from("listings")
    .select(
      "id,title,description,price,price_unit,is_negotiable,images,pin_code,vertical,address_line,submitted_at,is_featured," +
      "users(full_name)," +
      "india_districts(name)"
    )
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("submitted_at",  { ascending: false })
    .limit(40);

  if (category) query = query.eq("vertical", category);
  if (pin)      query = query.eq("pin_code", pin);
  if (maxPrice) query = query.lte("price", maxPrice);

  const { data } = await query;
  const listings = (data ?? []) as unknown as RawListing[];

  const filtered = q
    ? listings.filter(l =>
        l.title?.toLowerCase().includes(q.toLowerCase()) ||
        l.description?.toLowerCase().includes(q.toLowerCase()) ||
        l.address_line?.toLowerCase().includes(q.toLowerCase())
      )
    : listings;

  const activeVertical = VERTICALS.find(v => v.slug === category);

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {activeVertical ? `${activeVertical.icon} ${activeVertical.label}` : "Browse Marketplace"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{filtered.length} active listings {pin ? `in PIN ${pin}` : ""}</p>
        </div>
        <Link href="/listings/new" className="btn-royal text-xs px-4 py-2">+ Post Free</Link>
      </div>

      <div className="dash-page">
        {/* Search + filter bar */}
        <form className="card p-4 mb-6 flex flex-wrap gap-3">
          <input name="q" defaultValue={q} placeholder="Search listings..."
            className="flex-1 min-w-48 text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <input name="pin" defaultValue={pin} placeholder="PIN Code" maxLength={6}
            className="w-28 text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <input name="max_price" defaultValue={maxPrice || ""} placeholder="Max ₹" type="number"
            className="w-28 text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <input name="category" type="hidden" defaultValue={category} />
          <button type="submit" className="btn-royal text-xs px-4 py-2">Search</button>
          {(q || pin || maxPrice || category) && (
            <Link href="/user/browse" className="text-xs flex items-center text-gray-400 hover:text-gray-600">Clear all</Link>
          )}
        </form>

        {/* Vertical pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          <Link href="/user/browse"
            className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${!category ? "bg-brand-600 text-white border-brand-600" : "bg-white border-gray-200 text-gray-600 hover:border-brand-300"}`}>
            All
          </Link>
          {VERTICALS.map(v => (
            <Link key={v.slug} href={`/user/browse?category=${v.slug}${pin ? `&pin=${pin}` : ""}`}
              className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${category === v.slug ? "bg-brand-600 text-white border-brand-600" : "bg-white border-gray-200 text-gray-600 hover:border-brand-300"}`}>
              {v.icon} {v.label.split(" ")[0]}
            </Link>
          ))}
        </div>

        {/* Listings grid */}
        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 mb-2">No listings found</p>
            <p className="text-xs text-gray-400">Try removing filters or browse a different category</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(l => {
              const v   = VERTICALS.find(v => v.slug === l.vertical);
              const img = l.images?.[0];
              return (
                <Link key={l.id} href={`/listings/${l.id}`}
                  className="card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                  <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
                    {img ? (
                      <img src={img} alt={l.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl opacity-30">{v?.icon ?? "📦"}</span>
                    )}
                    {l.is_featured && (
                      <span className="absolute top-2 left-2 text-xs bg-amber-400 text-amber-900 font-bold px-2 py-0.5 rounded-full">★ Featured</span>
                    )}
                    {v && (
                      <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full border font-semibold ${v.color}`}>
                        {v.icon} {l.vertical}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {l.title}
                    </h3>
                    {l.description && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{l.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        {l.price ? (
                          <div className="text-base font-black text-gray-900">
                            ₹{Number(l.price).toLocaleString("en-IN")}
                            {l.price_unit && l.price_unit !== "fixed" && (
                              <span className="text-xs text-gray-400 font-normal ml-1">/{l.price_unit.replace("per_","")}</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">Price on request</div>
                        )}
                        {l.is_negotiable && <div className="text-xs text-green-600 font-semibold">Negotiable</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 truncate max-w-24">
                          {l.india_districts?.name ?? ""}
                        </div>
                        {l.pin_code && <div className="text-xs text-gray-400">{l.pin_code}</div>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <div className="text-xs text-gray-400">{l.users?.full_name ?? "Seller"}</div>
                      <span className="text-xs text-brand-600 font-semibold group-hover:underline">View →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
