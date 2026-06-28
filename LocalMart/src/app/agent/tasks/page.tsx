"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "new" | "in_progress" | "done" | "cancelled";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

const PRIORITY_CONFIG = {
  urgent: { color: "bg-red-100 text-red-700 border-red-200",    bar: "bg-red-500",    label: "🚨 Urgent" },
  high:   { color: "bg-orange-100 text-orange-700 border-orange-200", bar: "bg-orange-500", label: "🔴 High" },
  medium: { color: "bg-amber-100 text-amber-700 border-amber-200",  bar: "bg-amber-500",  label: "🟡 Medium" },
  low:    { color: "bg-green-100 text-green-700 border-green-200",   bar: "bg-green-500",  label: "🟢 Low" },
};

const STATUS_CONFIG = {
  new:         { color: "bg-blue-100 text-blue-700",    label: "New" },
  in_progress: { color: "bg-amber-100 text-amber-700",  label: "In Progress" },
  done:        { color: "bg-green-100 text-green-700",  label: "Done" },
  cancelled:   { color: "bg-gray-100 text-gray-500",    label: "Cancelled" },
};

export default function AgentTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"new" | "in_progress" | "all">("new");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  useEffect(() => { fetchTasks(); }, [filter]);

  async function fetchTasks() {
    setLoading(true);
    const { data: agent } = await supabase.from("agents")
      .select("id")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .single();

    if (!agent) { setLoading(false); return; }

    let q = supabase.from("tasks").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false }).limit(50);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setTasks((data as Task[]) ?? []);
    setLoading(false);
  }

  async function updateStatus(taskId: string, newStatus: Task["status"]) {
    startTransition(async () => {
      await supabase.from("tasks").update({
        status:       newStatus,
        completed_at: newStatus === "done" ? new Date().toISOString() : null,
      }).eq("id", taskId);
      fetchTasks();
    });
  }

  const newCount  = tasks.filter(t => t.status === "new").length;
  const inProgCount = tasks.filter(t => t.status === "in_progress").length;
  const doneCount = tasks.filter(t => t.status === "done").length;

  const isOverdue = (t: Task) =>
    t.due_date && t.status !== "done" && new Date(t.due_date) < new Date();

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-xs text-gray-500 mt-0.5">Assignments from operations and management</p>
        </div>
        <div className="flex gap-2 text-xs">
          {[
            { key: "new",         label: `New (${newCount})`,            color: "bg-blue-100 text-blue-700" },
            { key: "in_progress", label: `In Progress (${inProgCount})`, color: "bg-amber-100 text-amber-700" },
            { key: "all",         label: "All Tasks",                    color: "bg-gray-100 text-gray-600" },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as typeof filter)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${f.color} ${filter === f.key ? "ring-2 ring-brand-400" : "opacity-70"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-page">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "New",        value: newCount,   color: "border-l-blue-500" },
            { label: "In Progress",value: inProgCount,color: "border-l-amber-500" },
            { label: "Done",       value: doneCount,  color: "border-l-green-500" },
          ].map(s => (
            <div key={s.label} className={`stat-card border-l-4 ${s.color}`}>
              <div className="text-3xl font-black text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="card p-10 text-center text-gray-400 text-sm">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-500">No tasks in this filter. Great work!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const p = PRIORITY_CONFIG[task.priority];
              const s = STATUS_CONFIG[task.status];
              const overdue = isOverdue(task);
              return (
                <div key={task.id} className={`card p-5 border-l-4 ${p.color} ${overdue ? "ring-2 ring-red-200" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 text-sm">{task.title}</h3>
                        {overdue && <span className="text-xs text-red-600 font-semibold">⚠️ OVERDUE</span>}
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 leading-relaxed mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`badge ${p.color.split(" ").slice(0,2).join(" ")}`}>{p.label}</span>
                        <span className={`badge ${s.color}`}>{s.label}</span>
                        {task.due_date && (
                          <span className={`text-xs ${overdue ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                            📅 Due: {new Date(task.due_date).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                          </span>
                        )}
                        <span className="text-xs text-gray-300">
                          {new Date(task.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 shrink-0">
                      {task.status === "new" && (
                        <button onClick={() => updateStatus(task.id, "in_progress")} disabled={isPending}
                          className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-semibold disabled:opacity-50">
                          Start
                        </button>
                      )}
                      {task.status === "in_progress" && (
                        <button onClick={() => updateStatus(task.id, "done")} disabled={isPending}
                          className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50">
                          ✅ Done
                        </button>
                      )}
                      {task.status === "done" && (
                        <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          ✅ Completed
                        </span>
                      )}
                      {task.status !== "cancelled" && task.status !== "done" && (
                        <button onClick={() => updateStatus(task.id, "cancelled")} disabled={isPending}
                          className="text-xs px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 font-semibold disabled:opacity-50">
                          Skip
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
