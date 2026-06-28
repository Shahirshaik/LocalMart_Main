"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────

interface KPI {
  label:    string;
  value:    string | number;
  delta:    string;
  positive: boolean;
  icon:     string;
  color:    string;
}

interface AgentStatus {
  id:           string;
  name:         string;
  icon:         string;
  status:       "active" | "idle" | "error";
  last_action:  string;
  tasks_today:  number;
}

interface SupplyDemandRow {
  district:    string;
  vertical:    string;
  supply:      number;
  demand:      number;
  gap:         number;  // demand - supply
  gap_score:   number;  // 0-100
}

interface ProposalSummary {
  id:           string;
  title:        string;
  state:        string;
  priority:     string;
  type:         string;
  created_at:   string;
}

interface ActivityItem {
  id:         string;
  agent_icon: string;
  agent_name: string;
  action:     string;
  status:     string;
  district:   string;
  occurred:   string;
}

// ── Helpers ───────────────────────────────────────────────────


const AGENT_ICONS: Record<string, string> = {
  operations:   "⚙️",
  marketing:    "📊",
  user_proxy:   "👥",
  coordinator:  "🤖",
};

function gapColor(score: number): string {
  if (score >= 70) return "bg-red-500";
  if (score >= 40) return "bg-amber-400";
  if (score >= 15) return "bg-yellow-300";
  return "bg-green-400";
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

// ── Sub-components ────────────────────────────────────────────

function KPICard({ kpi }: { kpi: KPI }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl ${kpi.color}`}>
          {kpi.icon}
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${kpi.positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {kpi.positive ? "▲" : "▼"} {kpi.delta}
        </span>
      </div>
      <div className="text-2xl font-black text-gray-900 mb-0.5">{kpi.value}</div>
      <div className="text-xs text-gray-500 font-medium">{kpi.label}</div>
    </div>
  );
}

function ProposalPipeline({ proposals }: { proposals: ProposalSummary[] }) {
  const STAGES = [
    { key: "pending_board_review", label: "Board Review",    icon: "👥", color: "border-amber-400" },
    { key: "pending_ceo_approval", label: "CEO Approval",    icon: "👑", color: "border-purple-500" },
    { key: "executing",            label: "Executing",       icon: "⚡", color: "border-blue-400"   },
    { key: "executed",             label: "Executed",        icon: "✅", color: "border-green-400"  },
  ];

  const byStage = STAGES.map(s => ({
    ...s,
    items: proposals.filter(p => p.state === s.key || (s.key === "pending_board_review" && p.state === "revision_requested")),
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-black text-gray-900">Proposal Pipeline</h3>
        <span className="text-xs text-gray-400">{proposals.length} total</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {byStage.map((stage, i) => (
          <div key={stage.key} className="relative">
            {/* Connector line */}
            {i < byStage.length - 1 && (
              <div className="absolute top-4 right-0 w-1/2 h-0.5 bg-gray-100 z-0" style={{ right: "-1px" }} />
            )}

            <div className={`relative rounded-xl border-l-4 ${stage.color} bg-gray-50 p-3 z-10`}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">{stage.icon}</span>
                <span className="text-xs font-bold text-gray-700 truncate">{stage.label}</span>
              </div>

              <div className="text-2xl font-black text-gray-900 mb-2">{stage.items.length}</div>

              <div className="space-y-1.5">
                {stage.items.slice(0, 2).map(p => (
                  <div key={p.id} className="text-xs text-gray-600 bg-white rounded-lg p-1.5 border border-gray-100 truncate">
                    {p.priority === "critical" && <span className="text-red-500 mr-1">🔴</span>}
                    {p.priority === "high"     && <span className="text-amber-500 mr-1">🟡</span>}
                    {p.title.length > 22 ? p.title.slice(0, 22) + "…" : p.title}
                  </div>
                ))}
                {stage.items.length > 2 && (
                  <div className="text-xs text-gray-400 text-center">+{stage.items.length - 2} more</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupplyDemandMatrix({ rows }: { rows: SupplyDemandRow[] }) {
  const sorted = [...rows].sort((a, b) => b.gap_score - a.gap_score).slice(0, 8);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-black text-gray-900">Supply–Demand Heatmap</h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Critical</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />Warning</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400" />OK</span>
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map(row => (
          <div key={`${row.district}-${row.vertical}`} className="flex items-center gap-3">
            <div className="w-24 text-xs text-gray-600 font-medium truncate">{row.district}</div>
            <div className="w-16 text-xs text-gray-400 truncate">{row.vertical}</div>
            <div className="flex-1 flex items-center gap-2">
              {/* Supply bar */}
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
                <div className="h-full bg-blue-300 rounded-full transition-all"
                  style={{ width: `${Math.min((row.supply / Math.max(row.demand, row.supply, 1)) * 100, 100)}%` }} />
                <div className="absolute inset-0 flex items-center justify-end pr-1.5">
                  <span className="text-xs text-gray-600 font-semibold">{row.supply}</span>
                </div>
              </div>
              {/* Demand indicator */}
              <div className="text-xs text-gray-500 w-8 text-center font-semibold">{row.demand}</div>
            </div>
            {/* Gap score */}
            <div className={`h-5 w-5 rounded-full ${gapColor(row.gap_score)} flex-shrink-0`} title={`Gap score: ${row.gap_score}`} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="h-3 w-8 rounded-full bg-blue-300 inline-block" /> Supply</span>
        <span>Demand (number)</span>
        <span className="ml-auto">Gap score → 0=OK, 100=Critical</span>
      </div>
    </div>
  );
}

function AgentStatusPanel({ agents }: { agents: AgentStatus[] }) {
  const statusDot: Record<string, string> = {
    active: "bg-green-400 animate-pulse",
    idle:   "bg-gray-300",
    error:  "bg-red-400 animate-pulse",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-black text-gray-900 mb-4">AI Agent Status</h3>
      <div className="space-y-3">
        {agents.map(a => (
          <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xl shrink-0">
                {a.icon}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${statusDot[a.status]}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">{a.name}</span>
                <span className="text-xs text-gray-400">{a.tasks_today} tasks</span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">{a.last_action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const statusColors: Record<string, string> = {
    success: "text-green-600 bg-green-50",
    running: "text-blue-600 bg-blue-50",
    error:   "text-red-600 bg-red-50",
    pending: "text-amber-600 bg-amber-50",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-gray-900">Live Activity Feed</h3>
        <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Real-time
        </span>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No recent activity</div>
        )}
        {items.map(item => (
          <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-base shrink-0 mt-0.5">
              {item.agent_icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-gray-700">{item.agent_name}</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.action}</p>
                  {item.district && (
                    <span className="text-xs text-gray-400">📍 {item.district}</span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${statusColors[item.status] ?? "text-gray-500 bg-gray-50"}`}>
                    {item.status}
                  </span>
                  <div className="text-xs text-gray-400 mt-1">{item.occurred}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

interface Props {
  role: "ceo" | "board" | "agent";
}

const MOCK_SD_ROWS: SupplyDemandRow[] = [
  { district: "Nalgonda",    vertical: "vegetables", supply: 3,  demand: 18, gap: 15, gap_score: 83 },
  { district: "Nashik",      vertical: "mechanics",  supply: 1,  demand: 12, gap: 11, gap_score: 78 },
  { district: "Kochi",       vertical: "gas",        supply: 5,  demand: 9,  gap: 4,  gap_score: 44 },
  { district: "Vijayawada",  vertical: "property",   supply: 22, demand: 31, gap: 9,  gap_score: 38 },
  { district: "Jaipur",      vertical: "grocery",    supply: 14, demand: 20, gap: 6,  gap_score: 35 },
  { district: "Nagpur",      vertical: "constr.",    supply: 8,  demand: 11, gap: 3,  gap_score: 27 },
  { district: "Bengaluru",   vertical: "rentals",    supply: 34, demand: 40, gap: 6,  gap_score: 18 },
  { district: "Ludhiana",    vertical: "vehicles",   supply: 19, demand: 22, gap: 3,  gap_score: 14 },
];

const MOCK_AGENTS: AgentStatus[] = [
  { id: "ops",  name: "Operations Agent",  icon: "⚙️", status: "active", last_action: "Scanning Nalgonda — 3 shortage PINs found",          tasks_today: 12 },
  { id: "mkt",  name: "Marketing Agent",   icon: "📊", status: "active", last_action: "Posted 4 listings to Instagram, Facebook",            tasks_today: 8  },
  { id: "uxp",  name: "User Proxy Agent",  icon: "👥", status: "idle",   last_action: "Matched 2 buyers with sellers in Kochi",             tasks_today: 5  },
  { id: "crd",  name: "Coordinator",       icon: "🤖", status: "active", last_action: "Reviewing agent outputs, queuing next pipeline run", tasks_today: 3  },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  { id:"1", agent_icon:"⚙️", agent_name:"Operations Agent",  action:"Shortage detected: Vegetables in Nalgonda (3 listings vs 18 requests)", status:"success", district:"Nalgonda",   occurred:"2m ago" },
  { id:"2", agent_icon:"📊", agent_name:"Marketing Agent",   action:'Posted "Fresh Tomatoes from Ravi Farm" to Instagram + Facebook',          status:"success", district:"Nalgonda",   occurred:"4m ago" },
  { id:"3", agent_icon:"🤖", agent_name:"Coordinator",       action:"Escalated ad_budget_allocation proposal to board (₹25,000 request)",      status:"running", district:"Nalgonda",   occurred:"6m ago" },
  { id:"4", agent_icon:"👥", agent_name:"User Proxy Agent",  action:"Buyer matched: Priya Sharma ↔ Ravi Kumar (tomatoes, PIN 508207)",         status:"success", district:"Nalgonda",   occurred:"9m ago" },
  { id:"5", agent_icon:"⚙️", agent_name:"Operations Agent",  action:"Scanned 5 PINs in Nashik — mechanic shortage flagged",                   status:"success", district:"Nashik",     occurred:"14m ago"},
  { id:"6", agent_icon:"📊", agent_name:"Marketing Agent",   action:"Carousel posted: Top 5 properties in Vijayawada",                        status:"success", district:"Vijayawada", occurred:"22m ago"},
  { id:"7", agent_icon:"⚙️", agent_name:"Operations Agent",  action:"Morning mandi scan: 12 districts, 4 shortage alerts generated",          status:"success", district:"All",        occurred:"1h ago" },
];

export default function LiveMonitor({ role }: Props) {
  const supabase = createClient();

  const [kpis,      setKpis]      = useState<KPI[]>([]);
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [agents]                   = useState<AgentStatus[]>(MOCK_AGENTS);
  const [activity,  setActivity]  = useState<ActivityItem[]>(MOCK_ACTIVITY);
  const [sdRows]                   = useState<SupplyDemandRow[]>(MOCK_SD_ROWS);
  const [lastSync,  setLastSync]  = useState(new Date());
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      // Load real KPIs from Supabase
      const [
        { count: listingCount },
        { count: pendingCount },
        { count: agentCount },
        { count: userCount },
      ] = await Promise.all([
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("agents").select("*",   { count: "exact", head: true }),
        supabase.from("users").select("*",    { count: "exact", head: true }),
      ]);

      setKpis([
        { label: "Active Listings",    value: listingCount ?? 0, delta: "12%",  positive: true,  icon: "📋", color: "bg-purple-100" },
        { label: "Pending Review",     value: pendingCount ?? 0, delta: "3",    positive: false, icon: "⏳", color: "bg-amber-100"  },
        { label: "Verified Agents",    value: agentCount   ?? 0, delta: "2",    positive: true,  icon: "👥", color: "bg-blue-100"   },
        { label: "Registered Users",   value: userCount    ?? 0, delta: "18%",  positive: true,  icon: "🧑", color: "bg-green-100"  },
        { label: "Proposals Pending",  value: "—",               delta: "—",    positive: true,  icon: "📝", color: "bg-indigo-100" },
        { label: "AI Tasks Today",     value: agents.reduce((s, a) => s + a.tasks_today, 0), delta: "5", positive: true, icon: "🤖", color: "bg-violet-100" },
      ]);

      // Load proposals
      const { data: proposalData } = await supabase
        .from("proposals")
        .select("id, title, state, priority, proposal_type, created_at")
        .in("state", ["pending_board_review", "revision_requested", "pending_ceo_approval", "executing", "executed"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (proposalData) setProposals(proposalData as unknown as ProposalSummary[]);

      // Load AI agent logs for activity feed
      const { data: logData } = await supabase
        .from("ai_agent_logs")
        .select("id, action, status, payload, created_at, ai_agents(name)")
        .order("created_at", { ascending: false })
        .limit(15);

      if (logData?.length) {
        setActivity(logData.map(l => {
          const agentName  = (l.ai_agents as unknown as { name: string } | null)?.name ?? "AI Agent";
          const agentKey   = agentName.toLowerCase().includes("ops") ? "operations" :
                             agentName.toLowerCase().includes("mark") ? "marketing" :
                             agentName.toLowerCase().includes("user") ? "user_proxy" : "coordinator";
          return {
            id:          l.id,
            agent_icon:  AGENT_ICONS[agentKey] ?? "🤖",
            agent_name:  agentName,
            action:      l.action,
            status:      l.status,
            district:    (l.payload as Record<string, string>)?.district ?? "",
            occurred:    timeAgo(l.created_at),
          };
        }));
      }

      setLastSync(new Date());
    } catch {
      // Supabase tables may not have proposals yet — silently fall back to mock data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);

    // Subscribe to ai_agent_logs in real-time
    const channel = supabase
      .channel("monitor-logs")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "ai_agent_logs" },
        (payload) => {
          const l = payload.new as {
            id: string; action: string; status: string;
            payload: Record<string, string>; created_at: string;
          };
          const newItem: ActivityItem = {
            id:          l.id,
            agent_icon:  "🤖",
            agent_name:  "AI Agent",
            action:      l.action,
            status:      l.status,
            district:    l.payload?.district ?? "",
            occurred:    "just now",
          };
          setActivity(prev => [newItem, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="h-5 w-5 rounded-full border-2 border-purple-300 border-t-purple-600 animate-spin" />
          <span className="text-sm">Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900">Live Operations Monitor</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Last synced: {lastSync.toLocaleTimeString("en-IN")} · Auto-refreshes every 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-green-600">Systems Online</span>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors border border-gray-200">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => <KPICard key={k.label} kpi={k} />)}
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left: Supply-demand + proposals */}
        <div className="lg:col-span-2 space-y-5">
          <SupplyDemandMatrix rows={sdRows} />
          {role !== "agent" && <ProposalPipeline proposals={proposals} />}
        </div>

        {/* Right: Agents + Activity */}
        <div className="space-y-5">
          <AgentStatusPanel agents={agents} />
          <ActivityFeed items={activity} />
        </div>
      </div>

      {/* ── Alert banner for critical gaps ── */}
      {sdRows.filter(r => r.gap_score >= 70).length > 0 && (
        <div className="rounded-2xl border-l-4 border-red-500 p-4"
          style={{ background: "linear-gradient(90deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))" }}>
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">🚨</span>
            <div>
              <p className="text-sm font-bold text-red-700">Critical Supply Gaps Detected</p>
              <p className="text-xs text-red-500 mt-0.5">
                {sdRows.filter(r => r.gap_score >= 70).map(r => `${r.vertical} in ${r.district}`).join(" · ")}
              </p>
              <p className="text-xs text-red-400 mt-1">
                AI Operations Agent has automatically created shortage alerts. Board review may be required.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
