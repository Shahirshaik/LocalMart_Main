import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const STATUS_STYLE: Record<string, string> = {
  agent_submitted: "bg-blue-100 text-blue-700",
  board_review:    "bg-amber-100 text-amber-700",
  board_approved:  "bg-green-100 text-green-700",
  board_rejected:  "bg-red-100 text-red-700",
  ceo_review:      "bg-purple-100 text-purple-700",
  ceo_approved:    "bg-emerald-100 text-emerald-700",
  executed:        "bg-gray-100 text-gray-600",
};

export default async function BoardDashboard() {
  const supabase = await createClient();

  const [listingsRes, agentsRes, pendingRes] = await Promise.all([
    supabase.from("listings").select("id,status", { count: "exact" }),
    supabase.from("agents").select("id,is_active", { count: "exact" }),
    supabase.from("listings").select("id,title,submitted_at,status").eq("status", "pending").order("submitted_at").limit(8),
  ]);

  const pending = pendingRes.data ?? [];
  const totalListings = listingsRes.count ?? 0;
  const activeAgents  = (agentsRes.data ?? []).filter(a => a.is_active).length;

  const stats = [
    { icon: "⏳", label: "Pending Approvals", value: pending.length, color: "border-l-amber-500" },
    { icon: "📋", label: "Total Listings", value: totalListings, color: "border-l-purple-500" },
    { icon: "👥", label: "Active Agents", value: activeAgents, color: "border-l-blue-500" },
    { icon: "✅", label: "Approved Today", value: 0, color: "border-l-green-500" },
  ];

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Board Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Review agent proposals • Escalate to CEO</p>
        </div>
        <Link href="/board/approvals" className="btn-royal text-xs px-4 py-2">
          Open Approval Queue {pending.length > 0 && <span className="ml-1 bg-white/30 rounded-full px-1.5 text-xs">{pending.length}</span>}
        </Link>
      </div>

      <div className="dash-page">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className={`stat-card border-l-4 ${s.color}`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-3xl font-black text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Approval queue */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">📋 Agent Proposals for Review</h2>
              <Link href="/board/approvals" className="text-xs text-brand-600 font-semibold">Manage all →</Link>
            </div>
            {pending.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-sm font-medium">Queue is empty — all caught up!</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(l => (
                    <tr key={l.id}>
                      <td className="font-medium text-gray-800 max-w-[200px] truncate">{l.title}</td>
                      <td className="text-gray-400 text-xs">
                        {new Date(l.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_STYLE[l.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {l.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="text-xs px-2.5 py-1 rounded-lg bg-green-100 text-green-700 font-semibold hover:bg-green-200 transition-colors">Approve</button>
                          <button className="text-xs px-2.5 py-1 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Escalation panel */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4">🔄 Approval Flow</h3>
              <div className="space-y-3">
                {[
                  { step: "1. Agent Submits", desc: "Proposal enters queue", icon: "📝", color: "text-blue-600" },
                  { step: "2. Board Reviews", desc: "You approve or reject", icon: "🔍", color: "text-amber-600" },
                  { step: "3. Escalate to CEO", desc: "High-value decisions", icon: "👑", color: "text-purple-600" },
                  { step: "4. Execution", desc: "Auto-runs on approval", icon: "🚀", color: "text-green-600" },
                ].map(s => (
                  <div key={s.step} className="flex gap-3">
                    <span className="text-xl mt-0.5">{s.icon}</span>
                    <div>
                      <div className={`text-xs font-bold ${s.color}`}>{s.step}</div>
                      <div className="text-xs text-gray-400">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-3">⚡ Quick Escalate</h3>
              <p className="text-xs text-gray-500 mb-4">Send critical decisions directly to CEO for final sign-off.</p>
              <button className="btn-royal w-full text-xs py-2.5">
                Escalate to CEO →
              </button>
            </div>
          </div>
        </div>

        {/* India Verticals summary */}
        <div className="card p-6 mt-6">
          <h2 className="font-bold text-gray-900 mb-4">📦 Verticals Overview</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { icon: "🥬", label: "Vegetables", count: 0 },
              { icon: "🍽️", label: "Food", count: 0 },
              { icon: "🔥", label: "Gas", count: 0 },
              { icon: "🏗️", label: "Construction", count: 0 },
              { icon: "🏠", label: "Property", count: 0 },
              { icon: "🔧", label: "Mechanics", count: 0 },
            ].map(v => (
              <div key={v.label} className="flex flex-col items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-2xl mb-1">{v.icon}</span>
                <span className="text-xs font-semibold text-gray-700">{v.label}</span>
                <span className="text-lg font-black text-purple-600 mt-0.5">{v.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
