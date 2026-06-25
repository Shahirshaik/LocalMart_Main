"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClipboardList, Plus, X, CheckCircle } from "lucide-react";
import { TaskStatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { timeAgo } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/database";

const STATUSES: { value: TaskStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export default function DashboardTasksPage() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" as "low" | "medium" | "high" | "urgent", due_date: "" });

  const load = async () => {
    setLoading(true);
    let q = supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (filter) q = q.eq("status", filter);
    const { data } = await q;
    setTasks(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const createTask = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("tasks").insert({
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      due_date: form.due_date || null,
      status: "pending",
      created_by: user?.id ?? null,
    });
    setForm({ title: "", description: "", priority: "medium", due_date: "" });
    setShowForm(false);
    setSaving(false);
    load();
  };

  const updateStatus = async (id: string, status: TaskStatus) => {
    await supabase.from("tasks").update({ status }).eq("id", id);
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-brand-600" /> Tasks
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      {/* New task form */}
      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Create Task</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={createTask} className="space-y-3">
            <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Task title" className="input" />
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Description (optional)" rows={2} className="input resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as typeof form.priority }))}
                className="input bg-white">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                className="input" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? "Saving…" : "Create Task"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {STATUSES.map((s) => (
          <button key={s.value} onClick={() => setFilter(s.value as TaskStatus | "")}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === s.value ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading…</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="card p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
              <button onClick={() => updateStatus(t.id, t.status === "done" ? "pending" : "done")}
                className={`mt-0.5 shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  t.status === "done" ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-green-400"
                }`}>
                {t.status === "done" && <CheckCircle className="h-3.5 w-3.5" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${t.status === "done" ? "line-through text-gray-400" : "text-gray-900"}`}>
                  {t.title}
                </p>
                {t.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <TaskStatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  {t.due_date && (
                    <span className="text-xs text-gray-400">
                      Due: {new Date(t.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  <span className="text-xs text-gray-300">{timeAgo(t.created_at)}</span>
                </div>
              </div>

              <select value={t.status}
                onChange={(e) => updateStatus(t.id, e.target.value as TaskStatus)}
                className="shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-300">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
