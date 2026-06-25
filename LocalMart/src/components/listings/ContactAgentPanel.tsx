"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Phone, MessageCircle, ShieldCheck, Star, Loader2, CheckCircle2, ChevronDown } from "lucide-react";

interface Agent {
  id: string;
  user?: { full_name: string | null; phone: string | null } | null;
  rating: number | null;
  rating_count?: number;
}

interface Props {
  listingId: string;
  agent: Agent | null;
  buyerName?: string;
  buyerPhone?: string;
}

export function ContactAgentPanel({ listingId, agent, buyerName = "", buyerPhone = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: buyerName, phone: buyerPhone, message: "" });
  const supabase = createClient();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Please enter your name."); return; }
    if (!form.phone.trim()) { setError("Please enter your phone number."); return; }
    setError("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error: err } = await supabase.from("contact_requests").insert({
      listing_id:  listingId,
      buyer_id:    user?.id ?? null,
      buyer_name:  form.name.trim(),
      buyer_phone: form.phone.trim(),
      message:     form.message.trim() || null,
      agent_id:    agent?.id ?? null,
      status:      "new",
    });

    setLoading(false);
    if (err) { setError(err.message); return; }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="card p-5 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <p className="font-semibold text-gray-900 mb-1">Request Sent!</p>
        <p className="text-sm text-gray-500">
          Our local agent will call you within a few hours to help with this listing.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-4">
      {/* Agent badge */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {agent?.user?.full_name ?? "Local Agent"}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-green-500" />
            Verified LocalMart Agent
            {agent?.rating && (
              <span className="ml-1 flex items-center gap-0.5 text-amber-500">
                · <Star className="h-3 w-3 fill-amber-400" /> {agent.rating.toFixed(1)}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
        🛡️ <strong>Safe &amp; Trusted</strong> — Our agent verifies the seller and facilitates the deal in your village. Your contact is never shared with the seller directly.
      </div>

      {/* Quick call if agent has phone */}
      {agent?.user?.phone && (
        <div className="flex gap-2">
          <a
            href={`tel:${agent.user.phone}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
          >
            <Phone className="h-4 w-4" /> Call Agent
          </a>
          <a
            href={`https://wa.me/${String(agent.user.phone).replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      )}

      {/* Collapsible request form */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
      >
        <span>Send a Request to Agent</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠️ {error}</p>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Your Name <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Full name"
              className="input text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number <span className="text-red-500">*</span></label>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 9999999999"
              type="tel"
              className="input text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Message <span className="text-gray-400">(optional)</span></label>
            <textarea
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Any specific questions or requirements…"
              rows={2}
              className="input text-sm resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Request"}
          </button>
          <p className="text-[11px] text-gray-400 text-center">
            Agent will contact you within a few hours · Free service
          </p>
        </form>
      )}
    </div>
  );
}
