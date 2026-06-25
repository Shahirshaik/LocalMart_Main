import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { ListingStatusBadge } from "@/components/ui/StatusBadge";
import { formatPrice, timeAgo } from "@/lib/utils";
import {
  LayoutDashboard, ListChecks, ClipboardList, ArrowRight,
  IndianRupee, Inbox, ShieldCheck,
} from "lucide-react";
import type { Listing } from "@/types/database";

export default async function AgentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: agentRecord } = await supabase
    .from("agents")
    .select("id, commission_pct, referral_code")
    .eq("user_id", user?.id ?? "")
    .single();

  const today = new Date().toISOString().split("T")[0];

  const [
    { count: myListings },
    { count: pendingCount },
    { count: newRequests },
    { data: recentListings },
    { data: myTasks },
    { data: todayEarnings },
  ] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("seller_id", user?.id),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("contact_requests")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agentRecord?.id ?? "")
      .eq("status", "new"),
    supabase.from("listings")
      .select("id, title, status, price, price_type, created_at, village:villages(name)")
      .order("created_at", { ascending: false }).limit(6),
    supabase.from("tasks")
      .select("id, title, status, priority, due_date")
      .eq("assigned_to", user?.id ?? "").neq("status", "done").limit(5),
    agentRecord?.id
      ? supabase.from("agent_earnings")
          .select("amount")
          .eq("agent_id", agentRecord.id)
          .gte("earned_at", today)
      : Promise.resolve({ data: [] as { amount: number }[] }),
  ]);

  const todayTotal = (todayEarnings ?? []).reduce((a, r) => a + Number(r.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-brand-600" /> Agent Dashboard
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage listings, requests and earnings in your area</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="My Listings"    value={myListings ?? 0}     icon={ListChecks}    color="brand" />
        <StatCard title="Pending Review" value={pendingCount ?? 0}   icon={ListChecks}    color="orange" />
        <StatCard title="New Requests"   value={newRequests ?? 0}    icon={Inbox}         color="blue" />
        <StatCard title="Open Tasks"     value={myTasks?.length ?? 0} icon={ClipboardList} color="brand" />
        <StatCard title="Today's Earnings" value={`₹${todayTotal.toLocaleString("en-IN")}`} icon={IndianRupee} color="green" />
        <StatCard title="Commission Rate"  value={`${agentRecord?.commission_pct ?? 5}%`}   icon={ShieldCheck} color="orange" />
      </div>

      {/* New requests alert */}
      {(newRequests ?? 0) > 0 && (
        <Link href="/agent/requests"
          className="flex items-center justify-between rounded-2xl bg-brand-600 text-white px-5 py-4 hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200">
          <div className="flex items-center gap-3">
            <Inbox className="h-6 w-6" />
            <div>
              <p className="font-semibold">{newRequests} new buyer request{(newRequests ?? 0) > 1 ? "s" : ""} waiting!</p>
              <p className="text-sm text-brand-200">Buyers in your area need your help</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Listings */}
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

        {/* Tasks */}
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

      {/* Quick action grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { href: "/agent/listings",  icon: ListChecks,    bg: "bg-brand-100", ic: "text-brand-600",  label: "Review Listings",  sub: "Approve or reject" },
          { href: "/agent/requests",  icon: Inbox,         bg: "bg-blue-100",  ic: "text-blue-600",   label: "Buyer Requests",   sub: "Handle contact requests" },
          { href: "/agent/earnings",  icon: IndianRupee,   bg: "bg-green-100", ic: "text-green-600",  label: "My Earnings",      sub: "View commission & referrals" },
          { href: "/agent/services",  icon: ShieldCheck,   bg: "bg-purple-100",ic: "text-purple-600", label: "Local Services",   sub: "Directory & helplines" },
          { href: "/listings/new",    icon: ListChecks,    bg: "bg-orange-100",ic: "text-orange-600", label: "Post Listing",     sub: "Add a new listing" },
          { href: "/listings",        icon: LayoutDashboard, bg: "bg-gray-100",ic: "text-gray-600",   label: "Browse Listings",  sub: "See all listings" },
        ].map(({ href, icon: Icon, bg, ic, label, sub }) => (
          <Link key={href} href={href} className="card p-4 flex items-center gap-3 hover:shadow-md transition-all">
            <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`h-5 w-5 ${ic}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
              <p className="text-xs text-gray-400 truncate">{sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
