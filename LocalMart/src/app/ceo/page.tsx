import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LiveMonitor from "@/components/dashboard/LiveMonitor";

export default async function CeoDashboard() {
  const supabase = await createClient();

  const [listingsRes, agentsRes, usersRes, pendingRes] = await Promise.all([
    supabase.from("listings").select("id,status", { count: "exact" }),
    supabase.from("agents").select("id,is_active", { count: "exact" }),
    supabase.from("users").select("id,role", { count: "exact" }),
    supabase.from("listings").select("id,title,submitted_at,status").eq("status", "pending").order("submitted_at", { ascending: false }).limit(6),
  ]);

  const totalListings = listingsRes.count ?? 0;
  const activeListings = (listingsRes.data ?? []).filter(l => l.status === "active").length;
  const totalAgents = agentsRes.count ?? 0;
  const activeAgents = (agentsRes.data ?? []).filter(a => a.is_active).length;
  const totalUsers = usersRes.count ?? 0;
  const pendingListings = pendingRes.data ?? [];

  const stats = [
    { icon: "📋", label: "Total Listings", value: totalListings, sub: `${activeListings} active`, color: "border-l-purple-500" },
    { icon: "👥", label: "Agents", value: totalAgents, sub: `${activeAgents} active`, color: "border-l-blue-500" },
    { icon: "🧑‍🤝‍🧑", label: "Total Users", value: totalUsers, sub: "all roles", color: "border-l-green-500" },
    { icon: "⏳", label: "Pending Review", value: pendingListings.length, sub: "need approval", color: "border-l-amber-500" },
  ];

  const agentActions = [
    { icon: "🤖", label: "AI Agents Console", desc: "Monitor autonomous agent activity", href: "/ceo/ai-agents", color: "bg-purple-50 border-purple-200" },
    { icon: "✅", label: "Approval Queue", desc: "Review Board escalations", href: "/ceo/approvals", color: "bg-amber-50 border-amber-200" },
    { icon: "📍", label: "India Locations", desc: "Manage state/district/PIN coverage", href: "/ceo/locations", color: "bg-blue-50 border-blue-200" },
    { icon: "📊", label: "Analytics", desc: "Revenue, verticals, agent performance", href: "/ceo/analytics", color: "bg-green-50 border-green-200" },
  ];

  return (
    <div>
      {/* Topbar */}
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CEO Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">LocalMart Command Centre — All of India</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full font-semibold bg-purple-100 text-purple-700">🇮🇳 National View</span>
          <Link href="/ceo/approvals" className="btn-royal text-xs px-4 py-2">
            Approval Queue {pendingListings.length > 0 && <span className="ml-1 bg-white/30 text-white rounded-full px-1.5 py-0.5 text-xs">{pendingListings.length}</span>}
          </Link>
        </div>
      </div>

      <div className="dash-page">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className={`stat-card border-l-4 ${s.color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs text-gray-400">{s.sub}</span>
              </div>
              <div className="text-3xl font-black text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Pending listings */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">⏳ Pending Listings</h2>
              <Link href="/ceo/listings" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">View all →</Link>
            </div>
            {pendingListings.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-sm">All listings reviewed</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingListings.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-sm text-gray-800">{l.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(l.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <Link href={`/ceo/listings?id=${l.id}`}
                      className="text-xs px-3 py-1 rounded-lg bg-amber-100 text-amber-700 font-semibold hover:bg-amber-200 transition-colors">
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
            <div className="space-y-3">
              {agentActions.map(a => (
                <Link key={a.label} href={a.href}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${a.color} hover:shadow-sm transition-all`}>
                  <span className="text-xl mt-0.5">{a.icon}</span>
                  <div>
                    <div className="font-semibold text-xs text-gray-900">{a.label}</div>
                    <div className="text-xs text-gray-500">{a.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Approval Flow Diagram */}
        <div className="card p-6 mb-8">
          <h2 className="font-bold text-gray-900 mb-6">🔄 Approval State Machine</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { step: "Agent Submits", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "📝" },
              { step: "Board Review", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "🔍" },
              { step: "Board Approved", color: "bg-green-100 text-green-700 border-green-200", icon: "✅" },
              { step: "CEO Review", color: "bg-purple-100 text-purple-700 border-purple-200", icon: "👑" },
              { step: "CEO Approved", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "🎯" },
              { step: "Executed", color: "bg-gray-100 text-gray-700 border-gray-200", icon: "🚀" },
            ].map((s, i, arr) => (
              <div key={s.step} className="flex items-center gap-2 shrink-0">
                <div className={`border ${s.color} px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5`}>
                  <span>{s.icon}</span>{s.step}
                </div>
                {i < arr.length - 1 && <span className="text-gray-300 text-lg font-light">→</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2 text-xs text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-400 inline-block"></span>
              Board Rejected → Returns to Agent
            </div>
            <div className="flex items-center gap-2 text-xs text-orange-600">
              <span className="h-2 w-2 rounded-full bg-orange-400 inline-block"></span>
              CEO Rejected → Returns to Board
            </div>
          </div>
        </div>

        {/* AI Ecosystem */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-5">🤖 Multi-Agent AI Ecosystem</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: "Operations Agent", icon: "⚙️", status: "active", actions: 47, desc: "Auto-assigns listings to agents based on location & expertise" },
              { name: "Marketing Agent", icon: "📢", status: "active", actions: 23, desc: "Boosts high-value listings, targets buyers by PIN code" },
              { name: "User Proxy Agent", icon: "🙋", status: "active", actions: 91, desc: "Handles buyer queries, negotiates, books site visits" },
            ].map(a => (
              <div key={a.name} className="rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{a.icon}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {a.status === "active" ? "● Live" : "○ Idle"}
                  </span>
                </div>
                <div className="font-bold text-sm text-gray-900 mb-1">{a.name}</div>
                <div className="text-xs text-gray-500 mb-3 leading-relaxed">{a.desc}</div>
                <div className="text-xs text-brand-600 font-semibold">{a.actions} actions today</div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-purple-50 border border-purple-200">
            <p className="text-xs text-purple-700 font-semibold mb-1">Agent Communication Protocol</p>
            <p className="text-xs text-purple-600">
              Operations Agent → [task queue] → Marketing Agent → [approval request] → Board Review → CEO Sign-off → Execution
            </p>
          </div>
        </div>
      </div>

      {/* ── Live Operations Monitor ── */}
      <div className="mt-8">
        <LiveMonitor role="ceo" />
      </div>
    </div>
  );
}
