"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type WorkflowStatus =
  | "draft" | "agent_submitted" | "board_review"
  | "board_approved" | "board_rejected"
  | "ceo_review" | "ceo_approved" | "ceo_rejected"
  | "executed" | "cancelled";

interface Workflow {
  id: string;
  title: string;
  type: string;
  status: WorkflowStatus;
  payload: Record<string, unknown>;
  agent_notes: string | null;
  board_notes: string | null;
  board_reviewed_at: string | null;
  ceo_notes: string | null;
  ceo_reviewed_at: string | null;
  executed_at: string | null;
  created_at: string;
  agent_submitted_at: string | null;
  users: { full_name: string; role: string } | null;
}

const STATUS_META: Record<WorkflowStatus, { label: string; color: string }> = {
  draft:            { label: "Draft",           color: "bg-gray-100 text-gray-600" },
  agent_submitted:  { label: "Agent Submitted", color: "bg-blue-100 text-blue-700" },
  board_review:     { label: "Board Review",    color: "bg-amber-100 text-amber-700" },
  board_approved:   { label: "Board Approved",  color: "bg-green-100 text-green-700" },
  board_rejected:   { label: "Board Rejected",  color: "bg-red-100 text-red-600" },
  ceo_review:       { label: "CEO Review",      color: "bg-purple-100 text-purple-700" },
  ceo_approved:     { label: "CEO Approved",    color: "bg-emerald-100 text-emerald-700" },
  ceo_rejected:     { label: "CEO Rejected",    color: "bg-rose-100 text-rose-700" },
  executed:         { label: "Executed",         color: "bg-teal-100 text-teal-700" },
  cancelled:        { label: "Cancelled",        color: "bg-gray-100 text-gray-400" },
};

const FLOW_STEPS = [
  { key: "agent_submitted", label: "Agent Submitted" },
  { key: "board_review",    label: "Board Review" },
  { key: "board_approved",  label: "Board Approved" },
  { key: "ceo_review",      label: "CEO Review" },
  { key: "ceo_approved",    label: "CEO Approved" },
  { key: "executed",        label: "Executed" },
];

export default function CEOApprovalsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selected, setSelected]   = useState<Workflow | null>(null);
  const [filter, setFilter]       = useState<WorkflowStatus | "all">("ceo_review");
  const [ceoNotes, setCeoNotes]   = useState("");
  const [loading, setLoading]     = useState(true);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  useEffect(() => {
    fetchWorkflows();
  }, [filter]);

  async function fetchWorkflows() {
    setLoading(true);
    let q = supabase
      .from("approval_workflows")
      .select("*, users!submitted_by(full_name, role)")
      .order("created_at", { ascending: false })
      .limit(40);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setWorkflows((data as Workflow[]) ?? []);
    setLoading(false);
  }

  async function act(action: "approve" | "reject") {
    if (!selected) return;
    const newStatus: WorkflowStatus = action === "approve" ? "ceo_approved" : "ceo_rejected";
    startTransition(async () => {
      await supabase.from("approval_workflows").update({
        status:           newStatus,
        ceo_notes:        ceoNotes,
        ceo_reviewed_at:  new Date().toISOString(),
      }).eq("id", selected.id);
      setCeoNotes("");
      setSelected(null);
      fetchWorkflows();
    });
  }

  async function execute(wf: Workflow) {
    startTransition(async () => {
      await supabase.from("approval_workflows").update({
        status:      "executed",
        executed_at: new Date().toISOString(),
      }).eq("id", wf.id);
      fetchWorkflows();
    });
  }

  const counts = {
    ceo_review:  workflows.filter(w => w.status === "ceo_review").length,
    board_review: workflows.filter(w => w.status === "board_review").length,
    ceo_approved: workflows.filter(w => w.status === "ceo_approved").length,
    executed:     workflows.filter(w => w.status === "executed").length,
  };

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Approval Queue</h1>
          <p className="text-xs text-gray-500 mt-0.5">CEO final sign-off layer</p>
        </div>
        <div className="flex gap-2 text-xs">
          {[
            { key: "ceo_review", label: `Pending CEO (${counts.ceo_review})`, color: "bg-purple-100 text-purple-700" },
            { key: "board_review", label: `At Board (${counts.board_review})`, color: "bg-amber-100 text-amber-700" },
            { key: "ceo_approved", label: `Approved (${counts.ceo_approved})`, color: "bg-green-100 text-green-700" },
            { key: "all", label: "All", color: "bg-gray-100 text-gray-600" },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as WorkflowStatus | "all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${f.color} ${filter === f.key ? "ring-2 ring-brand-500" : "opacity-70 hover:opacity-100"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-page">
        {/* State machine flow */}
        <div className="card p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 mb-3">APPROVAL FLOW</p>
          <div className="flex items-center gap-1 flex-wrap">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center gap-1">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === step.key ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {step.label}
                </div>
                {i < FLOW_STEPS.length - 1 && <span className="text-gray-300 text-xs">→</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Workflow list */}
          <div className="lg:col-span-3 card">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : workflows.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-gray-500 text-sm">No workflows in this filter</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {workflows.map(wf => {
                  const meta = STATUS_META[wf.status];
                  const hrs  = wf.agent_submitted_at
                    ? Math.round((Date.now() - new Date(wf.agent_submitted_at).getTime()) / 3600000)
                    : null;
                  return (
                    <button key={wf.id}
                      onClick={() => { setSelected(wf); setCeoNotes(""); }}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selected?.id === wf.id ? "bg-purple-50 border-l-4 border-l-brand-500" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 truncate">{wf.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {wf.type.replace(/_/g, " ")} · {wf.users?.full_name ?? "Unknown"} ({wf.users?.role ?? "?"})
                          </div>
                          {hrs !== null && (
                            <div className={`text-xs mt-1 font-medium ${hrs > 48 ? "text-red-500" : hrs > 24 ? "text-amber-500" : "text-gray-400"}`}>
                              ⏱ {hrs}h waiting
                            </div>
                          )}
                        </div>
                        <span className={`badge shrink-0 ${meta.color}`}>{meta.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="card p-6 space-y-5 sticky top-6">
                <div>
                  <h2 className="font-bold text-gray-900 text-base mb-1">{selected.title}</h2>
                  <span className={`badge ${STATUS_META[selected.status].color}`}>{STATUS_META[selected.status].label}</span>
                </div>

                {/* Notes trail */}
                {selected.agent_notes && (
                  <div className="rounded-xl bg-blue-50 p-3 text-xs">
                    <p className="font-semibold text-blue-700 mb-1">🤖 Agent Notes</p>
                    <p className="text-blue-800">{selected.agent_notes}</p>
                  </div>
                )}
                {selected.board_notes && (
                  <div className="rounded-xl bg-amber-50 p-3 text-xs">
                    <p className="font-semibold text-amber-700 mb-1">⚖️ Board Notes ({selected.board_reviewed_at ? new Date(selected.board_reviewed_at).toLocaleDateString("en-IN") : ""})</p>
                    <p className="text-amber-800">{selected.board_notes}</p>
                  </div>
                )}

                {/* Payload */}
                {selected.payload && Object.keys(selected.payload).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">PAYLOAD</p>
                    <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-auto max-h-32 text-gray-700">
                      {JSON.stringify(selected.payload, null, 2)}
                    </pre>
                  </div>
                )}

                {/* CEO action */}
                {selected.status === "ceo_review" && (
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500">YOUR NOTES (optional)</p>
                    <textarea value={ceoNotes} onChange={e => setCeoNotes(e.target.value)}
                      rows={3} placeholder="Add rationale or instructions..."
                      className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => act("approve")} disabled={isPending}
                        className="flex-1 btn-royal text-xs py-2.5 disabled:opacity-50">
                        ✅ CEO Approve
                      </button>
                      <button onClick={() => act("reject")} disabled={isPending}
                        className="flex-1 text-xs py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                )}

                {selected.status === "ceo_approved" && !selected.executed_at && (
                  <button onClick={() => execute(selected)} disabled={isPending}
                    className="w-full text-xs py-2.5 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    ⚡ Execute Decision
                  </button>
                )}

                {selected.status === "executed" && (
                  <div className="rounded-xl bg-teal-50 p-3 text-xs text-teal-700 text-center font-semibold">
                    ✅ Executed on {selected.executed_at ? new Date(selected.executed_at).toLocaleDateString("en-IN") : "—"}
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-8 text-center text-gray-400 sticky top-6">
                <div className="text-3xl mb-2">👈</div>
                <p className="text-sm">Select a workflow to review</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
