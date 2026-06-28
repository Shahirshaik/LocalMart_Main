import { createClient } from "@/lib/supabase/server";

export default async function CEOAnalyticsPage() {
  const supabase = await createClient();

  const [
    listingsRes, usersRes, contactsRes, agentsRes, workflowsRes,
  ] = await Promise.all([
    supabase.from("listings").select("id,status,vertical,submitted_at,view_count,contact_count,state_id").order("submitted_at", { ascending: false }).limit(200),
    supabase.from("users").select("id,role,created_at,district_id").order("created_at", { ascending: false }).limit(200),
    supabase.from("contact_requests").select("id,status,created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("agents").select("id,total_listings,total_closed,rating,commission_pct").limit(50),
    supabase.from("approval_workflows").select("id,status,type,created_at").limit(100),
  ]);

  const listings  = listingsRes.data  ?? [];
  const users     = usersRes.data     ?? [];
  const contacts  = contactsRes.data  ?? [];
  const agents    = agentsRes.data    ?? [];
  const workflows = workflowsRes.data ?? [];

  // KPI calculations
  const activeListings  = listings.filter(l => l.status === "active").length;
  const pendingListings = listings.filter(l => l.status === "pending").length;
  const totalViews      = listings.reduce((s, l) => s + (l.view_count ?? 0), 0);
  const totalContacts   = listings.reduce((s, l) => s + (l.contact_count ?? 0), 0);
  const conversionRate  = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(1) : "0";

  const totalUsers    = users.length;
  const vendors       = users.filter(u => u.role === "vendor").length;
  const agentCount    = users.filter(u => u.role === "agent").length;

  const pendingApprovals  = workflows.filter(w => ["ceo_review","board_review","agent_submitted"].includes(w.status)).length;
  const executedWorkflows = workflows.filter(w => w.status === "executed").length;

  const avgAgentRating   = agents.length
    ? (agents.reduce((s, a) => s + (a.rating ?? 0), 0) / agents.length).toFixed(2)
    : "—";
  const totalClosed      = agents.reduce((s, a) => s + (a.total_closed ?? 0), 0);

  // Vertical breakdown
  const verticalCount: Record<string, number> = {};
  for (const l of listings) {
    verticalCount[l.vertical] = (verticalCount[l.vertical] ?? 0) + 1;
  }
  const topVerticals = Object.entries(verticalCount).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const maxV = topVerticals[0]?.[1] ?? 1;

  // Weekly new listings (last 7 days)
  const weeklyBuckets: Record<string, number> = {};
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    weeklyBuckets[d] = 0;
  }
  for (const l of listings) {
    const d = new Date(l.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    if (d in weeklyBuckets) weeklyBuckets[d]++;
  }
  const weeklyMax = Math.max(...Object.values(weeklyBuckets), 1);

  // Contact funnel
  const funnelStages = [
    { label: "Listings Active", value: activeListings,  pct: 100 },
    { label: "Total Views",     value: totalViews,      pct: totalViews > 0 ? 100 : 0 },
    { label: "Contacts Made",   value: contacts.length, pct: totalViews > 0 ? Math.round(contacts.length / Math.max(totalViews, 1) * 100) : 0 },
    { label: "Deals Closed",    value: totalClosed,     pct: contacts.length > 0 ? Math.round(totalClosed / Math.max(contacts.length, 1) * 100) : 0 },
  ];

  const VERTICAL_ICONS: Record<string, string> = {
    vegetables:"🥬", food:"🍽️", gas:"🔥", construction:"🏗️",
    property:"🏠", rentals:"🏘️", mechanics:"🔧", grocery:"🛒",
    jobs:"💼", vehicles:"🚗", furniture:"🛋️", mobiles:"📱",
  };

  const KPIs = [
    { icon: "📋", label: "Active Listings",   value: activeListings.toLocaleString("en-IN"), sub: `${pendingListings} pending` },
    { icon: "👥", label: "Total Users",        value: totalUsers.toLocaleString("en-IN"),      sub: `${vendors} vendors · ${agentCount} agents` },
    { icon: "👁️", label: "Total Views",        value: totalViews.toLocaleString("en-IN"),      sub: `${conversionRate}% contact rate` },
    { icon: "🤝", label: "Deals Closed",       value: totalClosed.toLocaleString("en-IN"),     sub: `avg ⭐ ${avgAgentRating}` },
    { icon: "⏳", label: "Pending Approvals",  value: pendingApprovals,                        sub: `${executedWorkflows} executed` },
    { icon: "📊", label: "Avg Agent Rating",   value: avgAgentRating + " ⭐",                  sub: `across ${agents.length} agents` },
  ];

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time platform intelligence</p>
        </div>
        <div className="text-xs text-gray-400">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
      </div>

      <div className="dash-page space-y-6">
        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {KPIs.map(k => (
            <div key={k.label} className="stat-card border-l-4 border-l-brand-500">
              <div className="text-2xl mb-2">{k.icon}</div>
              <div className="text-2xl font-black text-gray-900">{k.value}</div>
              <div className="text-sm font-semibold text-gray-700 mt-0.5">{k.label}</div>
              <div className="text-xs text-gray-400 mt-1">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly new listings bar chart */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-5">📈 New Listings — Last 7 Days</h2>
            <div className="flex items-end gap-2 h-32">
              {Object.entries(weeklyBuckets).map(([day, count]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs font-bold text-brand-600">{count}</div>
                  <div className="w-full rounded-t-lg bg-brand-500 transition-all"
                    style={{ height: `${Math.max((count / weeklyMax) * 96, count > 0 ? 8 : 2)}px` }} />
                  <div className="text-xs text-gray-400 text-center leading-tight" style={{ fontSize: 9 }}>{day}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion funnel */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-5">🔽 Marketplace Funnel</h2>
            <div className="space-y-3">
              {funnelStages.map((stage, i) => (
                <div key={stage.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{stage.label}</span>
                    <span className="text-gray-900 font-bold">{stage.value.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all"
                      style={{ width: `${stage.pct}%`, opacity: 1 - i * 0.15 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vertical breakdown */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-5">📦 Listings by Vertical</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {topVerticals.map(([vertical, count]) => (
              <div key={vertical} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xl shrink-0">{VERTICAL_ICONS[vertical] ?? "📦"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-700 capitalize truncate">{vertical}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{count} listings</div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div className="h-1 rounded-full bg-brand-500" style={{ width: `${(count / maxV) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approval workflow summary */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">⚙️ Approval Workflows</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            {[
              { label: "Draft",        status: "draft",         color: "bg-gray-100 text-gray-600" },
              { label: "Submitted",    status: "agent_submitted",color: "bg-blue-100 text-blue-700" },
              { label: "Board Review", status: "board_review",  color: "bg-amber-100 text-amber-700" },
              { label: "CEO Review",   status: "ceo_review",    color: "bg-purple-100 text-purple-700" },
              { label: "Executed",     status: "executed",      color: "bg-teal-100 text-teal-700" },
            ].map(s => (
              <div key={s.status} className={`rounded-xl p-3 ${s.color}`}>
                <div className="text-2xl font-black">
                  {workflows.filter(w => w.status === s.status).length}
                </div>
                <div className="text-xs font-semibold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
