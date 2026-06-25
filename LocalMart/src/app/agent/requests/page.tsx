"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Phone, MessageCircle, CheckCircle2, Clock, Loader2, InboxIcon, ChevronDown } from "lucide-react";
import { timeAgo } from "@/lib/utils";

type RequestStatus = "new" | "contacted" | "in_progress" | "closed" | "cancelled";

interface ContactRequest {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  message: string | null;
  status: RequestStatus;
  agent_notes: string | null;
  commission_earned: number | null;
  created_at: string;
  listing: {
    id: string;
    title: string;
    price: number | null;
    price_type: string;
  } | null;
}

const STATUS_COLORS: Record<RequestStatus, string> = {
  new:         "bg-blue-100 text-blue-700",
  contacted:   "bg-yellow-100 text-yellow-700",
  in_progress: "bg-orange-100 text-orange-700",
  closed:      "bg-green-100 text-green-700",
  cancelled:   "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  new:         "New",
  contacted:   "Contacted",
  in_progress: "In Progress",
  closed:      "Closed",
  cancelled:   "Cancelled",
};

export default function AgentRequestsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [commission, setCommission] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Get agent record
    const { data: agent } = await supabase
      .from("agents").select("id, assigned_villages").eq("user_id", user.id).single();
    if (!agent) { setLoading(false); return; }

    // Fetch requests for listings in this agent's villages OR directly assigned
    const { data } = await supabase
      .from("contact_requests")
      .select(`
        id, buyer_name, buyer_phone, message, status, agent_notes,
        commission_earned, created_at,
        listing:listings!contact_requests_listing_id_fkey(id, title, price, price_type, village_id)
      `)
      .or(`agent_id.eq.${agent.id},and(agent_id.is.null,listing.village_id.in.(${(agent.assigned_villages ?? []).join(",")}))`)
      .order("created_at", { ascending: false })
      .limit(100);

    setRequests((data as unknown as ContactRequest[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: RequestStatus) => {
    setUpdating(id);
    const patch: Record<string, unknown> = { status };
    if (notes[id]) patch.agent_notes = notes[id];
    if (status === "closed" && commission[id]) patch.commission_earned = Number(commission[id]);

    await supabase.from("contact_requests").update(patch).eq("id", id);
    await load();
    setUpdating(null);
    setExpanded(null);
  };

  const visible = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const counts = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Buyer Requests</h1>
        <p className="text-sm text-gray-400 mt-0.5">Contact requests from buyers in your area</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "new", "contacted", "in_progress", "closed", "cancelled"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              filter === s
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}
            {s !== "all" && counts[s] ? (
              <span className="ml-1.5 bg-white/30 rounded-full px-1.5 py-0.5">{counts[s]}</span>
            ) : null}
            {s === "all" && <span className="ml-1.5 bg-white/30 rounded-full px-1.5 py-0.5">{requests.length}</span>}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card p-12 text-center">
          <InboxIcon className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((req) => (
            <div key={req.id} className="card p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{req.buyer_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {req.listing?.title ?? "—"}
                    {req.listing?.price ? ` · ₹${req.listing.price.toLocaleString("en-IN")}` : ""}
                  </p>
                  {req.message && (
                    <p className="text-xs text-gray-500 mt-1 italic">"{req.message}"</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`badge text-[10px] ${STATUS_COLORS[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {timeAgo(req.created_at)}
                  </span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:${req.buyer_phone}`}
                  className="flex items-center gap-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 hover:bg-green-100 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" /> {req.buyer_phone}
                </a>
                <a
                  href={`https://wa.me/${req.buyer_phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-[#e8faf0] text-[#1a8c4e] text-xs font-medium px-3 py-1.5 hover:bg-[#d1f5e3] transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>

                {req.status === "new" && (
                  <button
                    onClick={() => updateStatus(req.id, "contacted")}
                    disabled={updating === req.id}
                    className="flex items-center gap-1.5 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-medium px-3 py-1.5 hover:bg-yellow-100 transition-colors disabled:opacity-50"
                  >
                    {updating === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark Contacted"}
                  </button>
                )}
                {req.status === "contacted" && (
                  <button
                    onClick={() => updateStatus(req.id, "in_progress")}
                    disabled={updating === req.id}
                    className="flex items-center gap-1.5 rounded-lg bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1.5 hover:bg-orange-100 transition-colors disabled:opacity-50"
                  >
                    {updating === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Start Deal"}
                  </button>
                )}

                {/* Expand for notes + close */}
                {req.status !== "closed" && req.status !== "cancelled" && (
                  <button
                    onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                    className="flex items-center gap-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 hover:bg-gray-200 transition-colors ml-auto"
                  >
                    Actions <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded === req.id ? "rotate-180" : ""}`} />
                  </button>
                )}

                {req.status === "closed" && req.commission_earned && (
                  <span className="flex items-center gap-1 ml-auto text-xs font-bold text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Earned ₹{req.commission_earned}
                  </span>
                )}
              </div>

              {/* Expanded actions panel */}
              {expanded === req.id && (
                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Agent Notes</label>
                    <textarea
                      value={notes[req.id] ?? req.agent_notes ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [req.id]: e.target.value }))}
                      rows={2}
                      placeholder="Notes about this buyer / deal status…"
                      className="input text-xs resize-none"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Commission Earned (₹)</label>
                      <input
                        type="number"
                        value={commission[req.id] ?? ""}
                        onChange={(e) => setCommission((c) => ({ ...c, [req.id]: e.target.value }))}
                        placeholder="e.g. 500"
                        className="input text-xs"
                        min="0"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => updateStatus(req.id, "closed")}
                        disabled={updating === req.id}
                        className="flex items-center gap-1.5 rounded-xl bg-green-600 text-white text-xs font-semibold px-4 py-2 hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {updating === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5" /> Mark Closed</>}
                      </button>
                      <button
                        onClick={() => updateStatus(req.id, "cancelled")}
                        disabled={updating === req.id}
                        className="rounded-xl bg-gray-100 text-gray-600 text-xs font-medium px-3 py-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
