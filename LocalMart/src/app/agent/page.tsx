import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { ListingStatusBadge } from "@/components/ui/StatusBadge";
import { formatPrice, timeAgo } from "@/lib/utils";
import { LayoutDashboard, ListChecks, ClipboardList, ArrowRight } from "lucide-react";
import type { Listing } from "@/types/database";

export default async function AgentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { count: myListings },
    { count: pendingCount },
    { data: recentListings },
    { data: myTasks },
  ] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("seller_id", user?.id),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("listings")
      .select("id, title, status, price, price_type, created_at, village:villages(name)")
      .order("created_at", { ascending: false }).limit(6),
    supabase.from("tasks")
      .select("id, title, status, priority, due_date")
      .eq("assigned_to", user?.id ?? "").neq("status", "done").limit(5),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-brand-600" /> Agent Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage listings in your area</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="My Listings"    value={myListings ?? 0}  icon={ListChecks}    color="brand" />
        <StatCard title="Pending Review" value={pendingCount ?? 0} icon={ListChecks}    color="orange" />
        <StatCard title="My Open Tasks"  value={myTasks?.length ?? 0} icon={ClipboardList} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Listings</h2>
            <Link href="/agent/listings" className="text-xs font-medium text-brand-600 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentListings && recentListings.length > 0 ? (
            <div className="space-y-2">
              {(recentListings as unknown as (Listing & { village?: { name: string } })[]).map((l) => (
                <Link key={l.id} href={`/dashboard/listings/${l.id}`}
                  className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-600">{l.title}</p>
                    <p className="text-xs text-gray-400">{(l as any).village?.name ?? "—"} · {timeAgo(l.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-brand-600">{formatPrice(l.price, l.price_type)}</p>
                    <ListingStatusBadge status={l.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-sm text-gray-400">No listings yet</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">My Tasks</h2>
          {myTasks && myTasks.length > 0 ? (
            <div className="space-y-2">
              {myTasks.map((t) => (
                <div key={t.id} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge text-[10px] ${
                      t.priority === "urgent" ? "bg-red-100 text-red-700" :
                      t.priority === "high" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                    }`}>{t.priority}</span>
                    {t.due_date && (
                      <span className="text-[10px] text-gray-400">
                        Due {new Date(t.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No tasks assigned</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/agent/listings" className="card p-4 flex items-center gap-3 hover:shadow-md transition-all">
          <div className="h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <ListChecks className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Review Listings</p>
            <p className="text-xs text-gray-400">Approve or reject</p>
          </div>
        </Link>
        <Link href="/listings/new" className="card p-4 flex items-center gap-3 hover:shadow-md transition-all">
          <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
            <ListChecks className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Post Listing</p>
            <p className="text-xs text-gray-400">Add a new listing</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
