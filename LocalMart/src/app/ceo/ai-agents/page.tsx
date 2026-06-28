"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AgentLog {
  id: string;
  agent_type: string;
  action: string;
  status: string;
  duration_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  listing_id: string | null;
  created_at: string;
}

interface AgentConfig {
  name: string;
  type: string;
  model: string;
  is_active: boolean;
  tools: string[];
}

const AGENT_META: Record<string, { icon: string; color: string; desc: string }> = {
  operations: {
    icon: "⚙️",
    color: "border-blue-200 bg-blue-50",
    desc: "Monitors supply-demand gaps per PIN code. Assigns tasks to field agents.",
  },
  marketing: {
    icon: "📊",
    color: "border-emerald-200 bg-emerald-50",
    desc: "Creates localised EN/HI/TE copy. Posts to Facebook, Instagram, LinkedIn.",
  },
  user_proxy: {
    icon: "👥",
    color: "border-amber-200 bg-amber-50",
    desc: "Matches buyers to sellers. Optimises listing descriptions. Sends WhatsApp.",
  },
  coordinator: {
    icon: "🎯",
    color: "border-purple-200 bg-purple-50",
    desc: "Routes tasks between agents. Escalates to human approval when needed.",
  },
};

export default function CEOAIAgentsPage() {
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [logs,    setLogs]    = useState<AgentLog[]>([]);
  const [trigger, setTrigger] = useState({ district: "Nalgonda", pins: "", mode: "full" });
  const [running, setRunning] = useState(false);
  const [runMsg,  setRunMsg]  = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("ai_logs_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_agent_logs" }, payload => {
        setLogs(prev => [payload.new as AgentLog, ...prev.slice(0, 49)]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    const [cfgRes, logsRes] = await Promise.all([
      supabase.from("ai_agents").select("name,type,model,is_active,tools").order("type"),
      supabase.from("ai_agent_logs").select("*").order("created_at", { ascending: false }).limit(30),
    ]);
    setConfigs((cfgRes.data as AgentConfig[]) ?? []);
    setLogs((logsRes.data as AgentLog[]) ?? []);
  }

  async function triggerPipeline() {
    setRunning(true);
    setRunMsg("Sending request to agent backend...");
    try {
      const body = {
        district:     trigger.district,
        pin_codes:    trigger.pins ? trigger.pins.split(",").map(p => p.trim()) : [],
        triggered_by: "ceo_dashboard",
      };
      const endpoint =
        trigger.mode === "full"      ? "/api/agents/run/full" :
        trigger.mode === "marketing" ? "/api/agents/run/marketing" :
        "/api/agents/run/full";

      const res  = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      setRunMsg(`✅ Pipeline started (Run ID: ${data.run_id ?? "—"}). Logs updating live below.`);
    } catch {
      setRunMsg("⚠️ Could not reach agent backend — is it running on :8000?");
    }
    setRunning(false);
  }

  const totalLogs    = logs.length;
  const completedLog = logs.filter(l => l.status === "completed").length;
  const totalTokens  = logs.reduce((s, l) => s + (l.input_tokens ?? 0) + (l.output_tokens ?? 0), 0);

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Agent Console</h1>
          <p className="text-xs text-gray-500 mt-0.5">Monitor and trigger the multi-agent ecosystem</p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="stat-card py-2 px-4 text-center">
            <div className="font-black text-gray-900">{totalLogs}</div>
            <div className="text-gray-400">Total Runs</div>
          </div>
          <div className="stat-card py-2 px-4 text-center">
            <div className="font-black text-green-600">{completedLog}</div>
            <div className="text-gray-400">Completed</div>
          </div>
          <div className="stat-card py-2 px-4 text-center">
            <div className="font-black text-gray-900">{(totalTokens / 1000).toFixed(1)}k</div>
            <div className="text-gray-400">Tokens Used</div>
          </div>
        </div>
      </div>

      <div className="dash-page space-y-6">
        {/* Agent cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(configs.length > 0 ? configs : Object.entries(AGENT_META).map(([type, m]) => ({ name: m.icon + " " + type, type, model: "claude-sonnet-4-6", is_active: true, tools: [] }))).map(agent => {
            const meta = AGENT_META[agent.type] ?? { icon: "🤖", color: "border-gray-200 bg-gray-50", desc: "" };
            const agentLogs = logs.filter(l => l.agent_type === agent.type);
            return (
              <div key={agent.type} className={`rounded-2xl border-2 p-4 ${meta.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl">{meta.icon}</div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${agent.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {agent.is_active ? "● Live" : "○ Off"}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 capitalize text-sm mb-1">{agent.type.replace("_"," ")} Agent</h3>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{meta.desc}</p>
                <div className="text-xs text-gray-400">
                  <div>Model: <span className="text-gray-600 font-medium">{agent.model}</span></div>
                  <div className="mt-1">{agentLogs.length} runs logged</div>
                </div>
                {agent.tools?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {agent.tools.slice(0, 3).map(t => (
                      <span key={t} className="text-xs bg-white/70 rounded px-1.5 py-0.5 text-gray-500 font-mono">{t}</span>
                    ))}
                    {agent.tools.length > 3 && <span className="text-xs text-gray-400">+{agent.tools.length - 3}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Manual trigger */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">🚀 Trigger Pipeline</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40">
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">DISTRICT</label>
              <input value={trigger.district} onChange={e => setTrigger(t => ({ ...t, district: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div className="flex-1 min-w-40">
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">PIN CODES (comma-separated)</label>
              <input value={trigger.pins} onChange={e => setTrigger(t => ({ ...t, pins: e.target.value }))}
                placeholder="508001, 508207, ..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold block mb-1.5">MODE</label>
              <select value={trigger.mode} onChange={e => setTrigger(t => ({ ...t, mode: e.target.value }))}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none">
                <option value="full">Full Pipeline</option>
                <option value="marketing">Marketing Only</option>
              </select>
            </div>
            <button onClick={triggerPipeline} disabled={running}
              className="btn-royal text-sm px-6 py-2 disabled:opacity-50">
              {running ? "Starting..." : "▶ Run Now"}
            </button>
          </div>
          {runMsg && (
            <div className={`mt-3 text-xs rounded-xl px-4 py-3 font-medium ${runMsg.startsWith("✅") ? "bg-green-50 text-green-700" : runMsg.startsWith("⚠️") ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
              {runMsg}
            </div>
          )}
        </div>

        {/* Live log feed */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">🔴 Live Agent Log Feed</h2>
            <span className="text-xs text-gray-400">Updates in real-time</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No agent runs yet. Trigger a pipeline above.</div>
            ) : logs.map(l => (
              <div key={l.id} className="px-4 py-3 hover:bg-gray-50 flex items-start gap-3">
                <span className="text-lg shrink-0">{AGENT_META[l.agent_type]?.icon ?? "🤖"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700 capitalize">{l.agent_type.replace("_"," ")}</span>
                    <span className="text-xs text-gray-400">→</span>
                    <span className="text-xs text-gray-700 font-mono">{l.action}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ml-auto ${l.status === "completed" ? "bg-green-100 text-green-700" : l.status === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {l.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {l.duration_ms ? `${l.duration_ms}ms · ` : ""}
                    {l.input_tokens ? `${((l.input_tokens + (l.output_tokens ?? 0)) / 1000).toFixed(1)}k tokens · ` : ""}
                    {new Date(l.created_at).toLocaleTimeString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
