"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

interface Workflow {
  id: string;
  title: string;
  type: string;
  status: string;
  agent_notes: string | null;
  board_notes: string | null;
  payload: Record<string, unknown>;
  agent_submitted_at: string | null;
  created_at: string;
  users: { full_name: string; role: string } | null;
}

const QUEUE_STATUSES = ["agent_submitted", "board_review"];

export default function BoardApprovalsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selected, setSelected]   = useState<Workflow | null>(null);
  const [notes,    setNotes]       = useState("");
  const [loading,  setLoading]    = useState(true);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  useEffect(() => { fetchWorkflows(); }, []);

  async function fetchWorkflows() {
    setLoading(true);
    const { data } = await supabase
      .from("approval_workflows")
      .select("*, users!submitted_by(full_name,role)")
      .in("status", [...QUEUE_STATUSES, "board_approved", "board_rejected"])
      .order("agent_submitted_at", { ascending: true });
    setWorkflows((data as Workflow[]) ?? []);
    setLoading(false);
  }

  async function moveToReview(wf: Workflow) {
    startTransition(async () => {
      await supabase.from("approval_workflows").update({ status: "board_review" }).eq("id", wf.id);
      fetchWorkflows();
    });
  }

  async function act(action: "approve" | "reject") {
    if (!selected) return;
    const newStatus = action === "approve" ? "board_approved" : "board_rejected";
    const nextStatus = action === "approve" ? "ceo_review" : "board_rejected";
    startTransition(async () => {
      await supabase.from("approval_workflows").update({
        status:           action === "approve" ? "ceo_review" : "board_rejected",
        board_notes:      notes,
        board_reviewed_at: new Date().toISOString(),
      }).eq("id", selected.id);
      setNotes("");
      setSelected(null);
      fetchWorkflows();
    });
    void newStatus; void nextStatus;
  }

  const pending  = workflows.filter(w => QUEUE_STATUSES.includes(w.status));
  const approved = workflows.filter(w => w.status === "ceo_review" || w.status === "board_approved");
  const rejected = workflows.filter(w => w.status === "board_rejected");

  const waitingHrs = (wf: Workflow) =>
    wf.agent_submitted_at
      ? Math.round((Date.now() - new Date(wf.agent_submitted_at).getTime()) / 3600000)
      : null;

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Board Approvals</h1>
          <p className="text-xs text-gray-500 mt-0.5">Review agent proposals before CEO escalation</p>
        </div>
        <div className="flex gap-2">
          <div className="stat-card py-2 px-4 text-center text-xs">
            <div className="font-black text-amber-600 text-xl">{pending.length}</div>
            <div className="text-gray-400">Pending</div>
          </div>
          <div className="stat-card py-2 px-4 text-center text-xs">
            <div className="font-black text-green-600 text-xl">{approved.length}</div>
            <div className="text-gray-400">Approved → CEO</div>
          </div>
        </div>
      </div>

      <div className="dash-page">
        {/* Escalation flow */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
            {[
              { label: "Agent Submits",    color: "bg-blue-100 text-blue-700" },
              { label: "→" },
              { label: "Board Reviews",    color: "bg-amber-100 text-amber-700" },
              { label: "→" },
              { label: "Board Approves",   color: "bg-green-100 text-green-700" },
              { label: "→" },
              { label: "CEO Review",       color: "bg-purple-100 text-purple-700" },
              { label: "→" },
              { label: "Executed",         color: "bg-teal-100 text-teal-700" },
            ].map((s, i) => (
              s.color
                ? <span key={i} className={`px-3 py-1.5 rounded-lg ${s.color}`}>{s.label}</span>
                : <span key={i} className="text-gray-300">{s.label}</span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: list */}
          <div className="lg:col-span-3 card divide-y divide-gray-50">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : workflows.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-gray-500 text-sm">Queue is clear!</p>
              </div>
            ) : (
              workflows.map(wf => {
                const hrs = waitingHrs(wf);
                const statusColor =
                  wf.status === "agent_submitted" ? "bg-blue-100 text-blue-700" :
                  wf.status === "board_review"    ? "bg-amber-100 text-amber-700" :
                  wf.status === "ceo_review"      ? "bg-purple-100 text-purple-700" :
                  wf.status === "board_rejected"  ? "bg-red-100 text-red-600" :
                  "bg-gray-100 text-gray-500";
                return (
                  <button key={wf.id}
                    onClick={() => { setSelected(wf); setNotes(""); }}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selected?.id === wf.id ? "bg-amber-50 border-l-4 border-l-amber-500" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">{wf.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {wf.type.replace(/_/g," ")} · by {wf.users?.full_name ?? "?"}
                        </div>
                        {hrs !== null && (
                          <div className={`text-xs mt-1 font-medium ${hrs > 48 ? "text-red-500" : hrs > 24 ? "text-amber-500" : "text-gray-400"}`}>
                            ⏱ {hrs}h in queue
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`badge ${statusColor}`}>{wf.status.replace(/_/g," ")}</span>
                        {wf.status === "agent_submitted" && (
                          <button
                            onClick={e => { e.stopPropagation(); moveToReview(wf); }}
                            className="text-xs px-2 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold">
                            Start Review
                          </button>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="card p-6 space-y-4 sticky top-6">
                <div>
                  <h2 className="font-bold text-gray-900">{selected.title}</h2>
                  <span className="badge bg-amber-100 text-amber-700 mt-1">
                    {selected.type.replace(/_/g," ")}
                  </span>
                </div>

                {selected.agent_notes && (
                  <div className="bg-blue-50 rounded-xl p-3 text-xs">
                    <p className="font-semibold text-blue-700 mb-1">🤖 Agent Notes</p>
                    <p className="text-blue-800">{selected.agent_notes}</p>
                  </div>
                )}

                {Object.keys(selected.payload ?? {}).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">PAYLOAD</p>
                    <pre className="text-xs bg-gray-50 rounded-lg p-3 overflow-auto max-h-32 text-gray-700">
                      {JSON.stringify(selected.payload, null, 2)}
                    </pre>
                  </div>
                )}

                {["agent_submitted","board_review"].includes(selected.status) && (
                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-500">BOARD NOTES</p>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      rows={3} placeholder="Rationale for approval / rejection..."
                      className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => act("approve")} disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                        ✅ Approve → CEO
                      </button>
                      <button onClick={() => act("reject")} disabled={isPending}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                )}

                {selected.status === "ceo_review" && (
                  <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-700 text-center font-semibold">
                    ✅ Sent to CEO for final sign-off
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

        {/* Rejected section */}
        {rejected.length > 0 && (
          <div className="card p-6 mt-6">
            <h2 className="font-bold text-gray-900 mb-4">❌ Recently Rejected ({rejected.length})</h2>
            <div className="space-y-2">
              {rejected.map(wf => (
                <div key={wf.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{wf.title}</div>
                    {wf.board_notes && <div className="text-xs text-red-600 mt-0.5">{wf.board_notes}</div>}
                  </div>
                  <span className="badge bg-red-100 text-red-600 shrink-0">Rejected</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
