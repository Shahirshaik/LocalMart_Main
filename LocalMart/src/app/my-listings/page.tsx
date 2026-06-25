import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { formatPrice, timeAgo } from "@/lib/utils";
import { Plus, MapPin, Clock, Eye, Tag, ChevronRight } from "lucide-react";
import type { UserRole, ListingFull } from "@/types/database";

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-700 border border-yellow-200",
  active:   "bg-green-100 text-green-700 border border-green-200",
  featured: "bg-purple-100 text-purple-700 border border-purple-200",
  sold:     "bg-gray-100 text-gray-500 border border-gray-200",
  rejected: "bg-red-100 text-red-600 border border-red-200",
  draft:    "bg-blue-50 text-blue-600 border border-blue-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending:  "⏳ Under Review",
  active:   "✅ Live",
  featured: "⭐ Featured",
  sold:     "✔ Sold",
  rejected: "❌ Rejected",
  draft:    "📝 Draft",
};

export default async function MyListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/my-listings");

  const { data: profile } = await supabase
    .from("users").select("role, full_name").eq("id", user.id).single();

  const userRole = (profile?.role ?? "customer") as UserRole;

  const { data: listings } = await supabase
    .from("listings")
    .select("*, village:villages(*), category:categories(*)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const all = (listings ?? []) as ListingFull[];
  const live     = all.filter((l) => l.status === "active" || l.status === "featured").length;
  const pending  = all.filter((l) => l.status === "pending").length;
  const sold     = all.filter((l) => l.status === "sold").length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userRole={userRole} userEmail={user.email} />

      <main className="flex-1 bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Welcome back, {profile?.full_name?.split(" ")[0] ?? "there"} 👋
                </p>
              </div>
              <Link href="/listings/new" className="btn-primary shrink-0">
                <Plus className="h-4 w-4" /> Post New
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: "Total Posted", value: all.length, icon: "📋", color: "text-gray-800" },
                { label: "Live Now",     value: live,       icon: "✅", color: "text-green-600" },
                { label: "Under Review", value: pending,    icon: "⏳", color: "text-yellow-600" },
              ].map((s) => (
                <div key={s.label} className="card p-3 text-center">
                  <div className="text-xl mb-0.5">{s.icon}</div>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
          {all.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">📭</p>
              <h2 className="text-xl font-bold text-gray-700 mb-2">No listings yet</h2>
              <p className="text-gray-400 text-sm mb-6">Post your first listing — it&apos;s free and takes less than 2 minutes!</p>
              <Link href="/listings/new" className="btn-primary">
                <Plus className="h-4 w-4" /> Post a Free Listing
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {all.map((l) => {
                const locParts = [l.area, l.city, l.district || l.village?.region, l.state || l.village?.state]
                  .filter(Boolean).slice(0, 3);

                return (
                  <div key={l.id} className="card p-4 flex gap-4 hover:shadow-md transition-shadow">
                    {/* Thumbnail */}
                    <div className="h-20 w-20 shrink-0 rounded-xl bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center text-3xl overflow-hidden">
                      {l.images?.[0]
                        ? <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover rounded-xl" />
                        : <span>{l.category?.icon ?? "📦"}</span>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{l.title}</h3>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[l.status] ?? STATUS_STYLES.pending}`}>
                          {STATUS_LABELS[l.status] ?? l.status}
                        </span>
                      </div>

                      <p className="text-base font-bold text-brand-600 mt-0.5">
                        {formatPrice(l.price, l.price_type)}
                      </p>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-400">
                        {locParts.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {locParts.join(", ")}
                          </span>
                        )}
                        {l.category && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {l.category.name_en ?? l.category.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(l.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {l.view_count ?? 0} views
                        </span>
                      </div>

                      {l.status === "pending" && (
                        <p className="text-xs text-amber-600 mt-1.5 bg-amber-50 rounded px-2 py-1 inline-block">
                          Under review — usually approved within a few hours
                        </p>
                      )}
                      {l.status === "rejected" && (
                        <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded px-2 py-1 inline-block">
                          Rejected — edit and resubmit
                        </p>
                      )}
                    </div>

                    <Link href={"/listings/" + l.id}
                      className="shrink-0 self-center text-gray-300 hover:text-brand-600 transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {sold > 0 && (
            <p className="text-center text-xs text-gray-400 mt-6">
              🎉 You&apos;ve sold {sold} item{sold > 1 ? "s" : ""} on LocalMart!
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
