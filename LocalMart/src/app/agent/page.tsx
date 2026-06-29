import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ShieldCheck, MapPin, Users, Banknote, CheckCircle, Clock, Star } from "lucide-react";

export default async function AgentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [agentRes, listingsRes, tasksRes, subAgentsRes, mediationsRes] = await Promise.all([
    supabase.from("agents").select("*").eq("user_id", user!.id).single(),
    supabase.from("listings").select("id,title,status,submitted_at").eq("agent_id", user!.id).order("submitted_at", { ascending: false }).limit(6),
    supabase.from("tasks").select("id,title,status,priority,due_date").order("created_at", { ascending: false }).limit(5),
    supabase.from("sub_agents").select("id,name,village,status,verified_at").eq("master_agent_id", user!.id).order("created_at", { ascending: false }).limit(8).maybeSingle().then(() =>
      supabase.from("sub_agents").select("id,name,village,status,verified_at").eq("master_agent_id", user!.id).order("created_at", { ascending: false }).limit(8)
    ),
    supabase.from("conversations").select("id,listing_id,agent_invited,last_message,last_message_at,buyer_id,seller_id").eq("agent_id", user!.id).order("last_message_at", { ascending: false }).limit(10),
  ]);

  const agent      = agentRes.data;
  const listings   = listingsRes.data ?? [];
  const tasks      = tasksRes.data ?? [];
  const subAgents  = (subAgentsRes as unknown as { data: SubAgent[] | null }).data ?? [];
  const mediations = mediationsRes.data ?? [];

  const pendingCount  = listings.filter(l => l.status === "pending").length;
  const activeCount   = listings.filter(l => l.status === "active").length;
  const activeMeds    = mediations.filter(m => m.agent_invited).length;

  type SubAgent = { id: string; name: string; village: string; status: string; verified_at: string | null };

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

  const VERTICALS = [
    { icon: "🥬", label: "Vegetables", href: "/agent/listings?v=vegetables" },
    { icon: "🍽️", label: "Restaurants", href: "/agent/listings?v=food" },
    { icon: "🔥", label: "Gas Agency",  href: "/agent/listings?v=gas" },
    { icon: "🏗️", label: "Construction",href: "/agent/listings?v=construction" },
    { icon: "🏠", label: "Property",    href: "/agent/listings?v=property" },
    { icon: "🔧", label: "Mechanics",   href: "/agent/listings?v=mechanics" },
  ];

  return (
    <div>
      {/* Topbar */}
      <div className="dash-topbar">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">Area Agent Workspace</h1>
          <p className="text-xs text-gray-500 mt-0.5 hidden md:block">
            PIN Code: <strong>{agent?.pin_code ?? "—"}</strong> · 0% platform commission · You keep 100%
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/agent/ai-assist" className="btn-secondary text-xs px-3 py-2">🤖 AI</Link>
          <Link href="/listings/new" className="btn-royal text-xs px-3 md:px-4 py-2">+ List</Link>
        </div>
      </div>

      <div className="dash-page space-y-6">

        {/* PIN Coverage Banner */}
        <div className="rounded-2xl p-4 md:p-5 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#065F46,#047857,#10B981)" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-emerald-200 text-xs font-medium">Your Exclusive Coverage Area</p>
                <p className="text-white font-black text-2xl">{agent?.pin_code ?? "—"}</p>
                <p className="text-emerald-200 text-xs">{agent?.district ?? "District"} · {agent?.state ?? "State"}</p>
              </div>
            </div>
            <div className="flex gap-3 text-center">
              <div className="bg-white/15 rounded-xl px-3 py-2 min-w-[64px]">
                <div className="text-white font-black text-xl">{activeMeds}</div>
                <div className="text-emerald-200 text-[10px]">Active Deals</div>
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-2 min-w-[64px]">
                <div className="text-white font-black text-xl">{subAgents.length}</div>
                <div className="text-emerald-200 text-[10px]">Sub-Agents</div>
              </div>
              <div className="bg-white/15 rounded-xl px-3 py-2 min-w-[64px]">
                <div className="text-amber-300 font-black text-xl">{agent?.commission_pct ?? 5}%</div>
                <div className="text-emerald-200 text-[10px]">Your Cut</div>
              </div>
            </div>
          </div>
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -right-2 -bottom-8 h-24 w-24 rounded-full bg-white/5" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { icon: "📋", label: "My Listings", value: listings.length, sub: `${activeCount} live`, color: "border-l-purple-500" },
            { icon: "⏳", label: "Pending Review", value: pendingCount, sub: "awaiting approval", color: "border-l-amber-500" },
            { icon: "🛡️", label: "Deal Mediations", value: activeMeds, sub: "peer transactions", color: "border-l-emerald-500" },
            { icon: "✅", label: "Tasks", value: tasks.length, sub: `${tasks.filter(t => t.status === "done").length} done`, color: "border-l-blue-500" },
          ].map(s => (
            <div key={s.label} className={`stat-card border-l-4 ${s.color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{s.icon}</span>
                <span className="text-xs text-gray-400">{s.sub}</span>
              </div>
              <div className="text-2xl md:text-3xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs md:text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Zero Commission Notice */}
        <div className="card p-4 flex items-center gap-3 border-emerald-100 bg-emerald-50">
          <ShieldCheck className="h-8 w-8 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-emerald-900 text-sm">Zero-Commission Model Active</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              LocalMart earns <strong>0%</strong> from peer transactions you mediate. Your negotiated fee goes 100% to you.
              Platform revenue comes from premium ad placements only.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">

          {/* Active Deal Mediations */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Peer Deals Requiring Help
              </h2>
              <Link href="/user/inbox" className="text-xs text-purple-600 font-semibold">Open Chat →</Link>
            </div>
            {mediations.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShieldCheck className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm">No mediation requests yet</p>
                <p className="text-xs mt-1">When buyers or sellers request Safe-Deal, you&apos;ll appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mediations.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {m.listing_id ? `Deal #${m.id.slice(0, 8)}` : "Direct peer chat"}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {m.last_message_at ? new Date(m.last_message_at).toLocaleDateString("en-IN") : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {m.agent_invited
                        ? <span className="badge badge-green text-[10px]">🛡️ Active</span>
                        : <span className="badge badge-gray text-[10px]">Pending</span>}
                      <Link href={`/user/inbox?conv=${m.id}`}
                        className="text-xs text-purple-600 font-semibold hover:underline">
                        Open →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-500" /> Tasks
              </h2>
              <Link href="/agent/tasks" className="text-xs text-purple-600 font-semibold">All →</Link>
            </div>
            {tasks.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No tasks assigned</p>
            ) : (
              <div className="space-y-2.5">
                {tasks.map(t => (
                  <div key={t.id} className="p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-all">
                    <p className="font-medium text-xs text-gray-800 mb-1 truncate">{t.title}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${PRIORITY_COLOR[t.priority] ?? "text-gray-500"}`}>
                        {t.priority}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{t.due_date ?? "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sub-Agent Roster */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" /> Sub-Agent Network
            </h2>
            <Link href="/agent/sub-agents" className="text-xs text-purple-600 font-semibold">Manage →</Link>
          </div>
          {subAgents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No sub-agents registered yet</p>
              <p className="text-xs text-gray-400 mt-1">Register local village leaders or trusted contacts to help verify deals in your area</p>
              <Link href="/agent/sub-agents/new" className="btn-royal text-xs px-4 py-2 mt-3 inline-flex">
                + Register Sub-Agent
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Village / Ward</th>
                    <th>Status</th>
                    <th>Verified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(subAgents as SubAgent[]).map(sa => (
                    <tr key={sa.id}>
                      <td className="font-medium text-gray-800">{sa.name}</td>
                      <td className="text-gray-500">{sa.village}</td>
                      <td>
                        <span className={sa.status === "active" ? "badge badge-green" : "badge badge-gray"}>
                          {sa.status}
                        </span>
                      </td>
                      <td className="text-gray-400 text-xs">
                        {sa.verified_at ? new Date(sa.verified_at).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td>
                        <Link href={`/agent/sub-agents/${sa.id}`} className="text-xs text-purple-600 font-semibold">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* My Listings + Deal Settlement */}
        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-sm">📋 My Listings</h2>
              <Link href="/agent/listings" className="text-xs text-purple-600 font-semibold">All →</Link>
            </div>
            {listings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-3">No listings yet</p>
                <Link href="/listings/new" className="btn-royal text-xs px-4 py-2">Post First Listing</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {listings.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs text-gray-800 truncate">{l.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(l.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className={`badge ml-3 shrink-0 ${STATUS_COLOR[l.status] ?? "status-draft"}`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deal Settlement Panel */}
          <div className="card p-5 border-emerald-100">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4">
              <Banknote className="h-4 w-4 text-emerald-500" /> Deal Settlement Panel
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Once you physically verify the goods, land documents, or service quality,
                click <strong>Authorize Release</strong> to confirm the deal is complete.
                The agreed amount transfers from buyer to seller. Your commission is credited instantly.
              </p>
            </div>
            {activeMeds === 0 ? (
              <div className="text-center py-4">
                <Star className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No deals pending settlement</p>
              </div>
            ) : (
              mediations.filter(m => m.agent_invited).slice(0, 3).map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50 mb-2">
                  <div>
                    <p className="text-xs font-semibold text-emerald-900">Deal #{m.id.slice(0, 8)}</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">Awaiting your inspection</p>
                  </div>
                  <Link href={`/user/inbox?conv=${m.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg,#065F46,#10B981)" }}>
                    <CheckCircle className="h-3.5 w-3.5" /> Verify
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Verticals quick-post */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 mb-4 text-sm">📦 Quick Post by Vertical</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {VERTICALS.map(v => (
              <Link key={v.label} href={v.href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-purple-200 hover:bg-purple-50 hover:shadow-sm transition-all">
                <span className="text-2xl">{v.icon}</span>
                <span className="text-xs font-medium text-gray-600 text-center leading-tight">{v.label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
