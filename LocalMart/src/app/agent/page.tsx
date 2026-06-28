import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AgentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [agentRes, listingsRes, tasksRes] = await Promise.all([
    supabase.from("agents").select("*").eq("user_id", user!.id).single(),
    supabase.from("listings").select("id,title,status,submitted_at").eq("agent_id", user!.id).order("submitted_at", { ascending: false }).limit(6),
    supabase.from("tasks").select("id,title,status,priority,due_date").order("created_at", { ascending: false }).limit(5),
  ]);

  const agent    = agentRes.data;
  const listings = listingsRes.data ?? [];
  const tasks    = tasksRes.data ?? [];

  const pendingCount = listings.filter(l => l.status === "pending").length;
  const activeCount  = listings.filter(l => l.status === "active").length;

  const stats = [
    { icon: "📋", label: "My Listings", value: listings.length, sub: `${activeCount} active` },
    { icon: "⏳", label: "Pending", value: pendingCount, sub: "awaiting review" },
    { icon: "✅", label: "Tasks", value: tasks.length, sub: `${tasks.filter(t => t.status === "done").length} done` },
    { icon: "💰", label: "Commission %", value: `${agent?.commission_pct ?? 5}%`, sub: "per closed deal" },
  ];

  const VERTICAL_ACTIONS = [
    { icon: "🥬", label: "Vegetables & Fruits", href: "/agent/listings?v=vegetables" },
    { icon: "🍽️", label: "Restaurants", href: "/agent/listings?v=food" },
    { icon: "🔥", label: "Gas Agency", href: "/agent/listings?v=gas" },
    { icon: "🏗️", label: "Construction", href: "/agent/listings?v=construction" },
    { icon: "🏠", label: "Property Sale", href: "/agent/listings?v=property" },
    { icon: "🔧", label: "Mechanics", href: "/agent/listings?v=mechanics" },
  ];

  const STATUS_COLOR: Record<string, string> = {
    pending:  "status-pending",
    active:   "status-active",
    sold:     "status-approved",
    expired:  "status-rejected",
    draft:    "status-draft",
    rejected: "status-rejected",
  };

  const PRIORITY_COLOR: Record<string, string> = {
    urgent: "text-red-600",
    high:   "text-orange-600",
    medium: "text-amber-600",
    low:    "text-green-600",
  };

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Operations Agent</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage listings, tasks, and earn commissions</p>
        </div>
        <div className="flex gap-2">
          <Link href="/agent/ai-assist" className="btn-secondary text-xs px-3 py-2">🤖 AI Assist</Link>
          <Link href="/listings/new" className="btn-royal text-xs px-4 py-2">+ New Listing</Link>
        </div>
      </div>

      <div className="dash-page">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="stat-card border-l-4 border-l-brand-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs text-gray-400">{s.sub}</span>
              </div>
              <div className="text-3xl font-black text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* My Listings */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">📋 My Listings</h2>
              <Link href="/agent/listings" className="text-xs text-brand-600 font-semibold">View all →</Link>
            </div>
            {listings.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm mb-3">No listings yet</p>
                <Link href="/listings/new" className="btn-royal text-xs px-4 py-2">Post First Listing</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {listings.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-gray-800 truncate">{l.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(l.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                    <span className={`badge ml-3 shrink-0 ${STATUS_COLOR[l.status] ?? "status-draft"}`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-sm">✅ Tasks</h2>
              <Link href="/agent/tasks" className="text-xs text-brand-600 font-semibold">All →</Link>
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No tasks assigned</div>
            ) : (
              <div className="space-y-2.5">
                {tasks.map(t => (
                  <div key={t.id} className="p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-all">
                    <div className="font-medium text-xs text-gray-800 mb-1 truncate">{t.title}</div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${PRIORITY_COLOR[t.priority] ?? "text-gray-500"}`}>
                        {t.priority}
                      </span>
                      <span className="text-xs text-gray-400">{t.due_date ?? "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Verticals */}
        <div className="card p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">📦 Quick Post by Vertical</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {VERTICAL_ACTIONS.map(v => (
              <Link key={v.label} href={v.href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-brand-200 hover:bg-brand-50 hover:shadow-sm transition-all cursor-pointer">
                <span className="text-2xl">{v.icon}</span>
                <span className="text-xs font-medium text-gray-600 text-center leading-tight">{v.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* AI Assist banner */}
        <div className="rounded-2xl p-6 text-white" style={{background:"linear-gradient(135deg,#1E0A3C,#4C1D95)"}}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-bold text-lg mb-1">AI Agent Assist</h3>
              <p className="text-purple-200 text-sm max-w-lg leading-relaxed">
                Your AI Operations Agent can auto-draft listings, assign them to the right buyers, and submit proposals for Board approval — all in one click.
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link href="/agent/ai-assist" className="text-center text-xs font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90" style={{background:"#F59E0B",color:"#1E0A3C"}}>
                Open AI Console →
              </Link>
              <Link href="/agent/requests" className="text-center text-xs font-semibold px-5 py-2.5 rounded-xl border border-purple-600 text-purple-200 hover:bg-white/10 transition-all">
                View Requests
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
