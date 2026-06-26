import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { ListingStatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { LayoutDashboard, ListChecks, Users, MapPin, ClipboardList, ArrowRight, Clock, Download, FileSpreadsheet } from "lucide-react";
import { formatPrice, timeAgo } from "@/lib/utils";
import type { Listing } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalListings },
    { count: activeListings },
    { count: pendingListings },
    { count: totalAgents },
    { count: totalVillages },
    { data: pendingQueue },
    { data: recentTasks },
  ] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("agents").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("villages").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("listings")
      .select("id, title, type, status, price, price_type, created_at, village:villages(name)")
      .eq("status", "pending").order("created_at", { ascending: false }).limit(8),
    supabase.from("tasks")
      .select("id, title, status, priority, due_date")
      .neq("status", "done").order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="space-y-7 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-brand-600" /> CEO Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage listings, agents and villages</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/api/export/listings"
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-brand-300 transition-all shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Export CSV
          </a>
          <a
            href="/api/export/listings?status=pending"
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-200 bg-orange-50 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-all shadow-sm"
          >
            <Download className="h-4 w-4" />
            Pending Only
          </a>
          <Link href="/dashboard/listings" className="btn-primary text-sm">
            Review Listings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Export info banner */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3">
        <FileSpreadsheet className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <span className="font-semibold">Area-wise Excel Download:</span>{" "}
          Click <span className="font-medium">Export CSV</span> to download all listings.
          Filter by area:{" "}
          <a href="/api/export/listings?state=Telangana" download className="underline font-medium hover:text-blue-900">Telangana</a>
          {" · "}
          <a href="/api/export/listings?status=active" download className="underline font-medium hover:text-blue-900">Active only</a>
          {" · "}
          <a href="/api/export/listings?status=pending" download className="underline font-medium hover:text-blue-900">Pending only</a>.
          Opens directly in Excel.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Listings" value={totalListings ?? 0} icon={ListChecks} color="brand" />
        <StatCard title="Active"          value={activeListings ?? 0} icon={ListChecks} color="green" />
        <StatCard title="Pending Review"  value={pendingListings ?? 0} icon={Clock}      color="orange" />
        <StatCard title="Active Agents"   value={totalAgents ?? 0}   icon={Users}       color="blue" />
        <StatCard title="Villages"        value={totalVillages ?? 0} icon={MapPin}      color="brand" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Pending Review</h2>
            <Link href="/dashboard/listings?status=pending"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {pendingQueue && pendingQueue.length > 0 ? (
            <div className="space-y-2">
              {(pendingQueue as unknown as (Listing & { village?: { name: string } })[]).map((l) => (
                <Link key={l.id} href={`/dashboard/listings/${l.id}`}
                  className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-50 transition-colors group">
                  <div className="h-9 w-9 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                    <ListChecks className="h-4 w-4 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-600">{l.title}</p>
                    <p className="text-xs text-gray-400">{(l as any).village?.name ?? "—"} · {timeAgo(l.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-brand-600">{formatPrice(l.price, l.price_type)}</p>
                    <ListingStatusBadge status={l.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-sm text-gray-400">No pending listings</p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Open Tasks</h2>
            <Link href="/dashboard/tasks"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentTasks && recentTasks.length > 0 ? (
            <div className="space-y-2">
              {recentTasks.map((t) => (
                <div key={t.id} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
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
            <div className="text-center py-10">
              <ClipboardList className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No open tasks</p>
              <Link href="/dashboard/tasks" className="text-xs text-brand-600 hover:underline mt-1 block">Create task</Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: "/dashboard/listings", icon: ListChecks,   label: "Manage Listings", color: "brand" },
          { href: "/dashboard/agents",   icon: Users,        label: "Manage Agents",   color: "blue" },
          { href: "/dashboard/villages", icon: MapPin,       label: "Manage Villages", color: "green" },
          { href: "/dashboard/tasks",    icon: ClipboardList,label: "Assign Tasks",    color: "orange" },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link key={href} href={href}
            className="card p-4 flex flex-col items-center gap-2 text-center hover:shadow-md transition-all group">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              color === "brand" ? "bg-brand-100" : color === "blue" ? "bg-blue-100" :
              color === "green" ? "bg-green-100" : "bg-orange-100"
            }`}>
              <Icon className={`h-5 w-5 ${
                color === "brand" ? "text-brand-600" : color === "blue" ? "text-blue-600" :
                color === "green" ? "text-green-600" : "text-orange-600"
              }`} />
            </div>
            <span className="text-xs font-semibold text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
