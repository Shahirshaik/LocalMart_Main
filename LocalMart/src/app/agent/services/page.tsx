"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Stethoscope, ShieldAlert, Landmark, Building2, Bus,
  GraduationCap, Zap, Droplets, HelpCircle, Plus, Phone,
  Loader2, AlertTriangle,
} from "lucide-react";

type ServiceType =
  | "hospital" | "police" | "bank" | "government"
  | "transport" | "education" | "electricity" | "water" | "other";

interface LocalService {
  id: string;
  name: string;
  service_type: ServiceType;
  phone: string | null;
  address: string | null;
  timings: string | null;
  is_emergency: boolean;
  village_id: string | null;
}

const TYPE_META: Record<ServiceType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  hospital:    { label: "Hospital / Health",  icon: Stethoscope,  color: "bg-red-100 text-red-600" },
  police:      { label: "Police",             icon: ShieldAlert,  color: "bg-blue-100 text-blue-600" },
  bank:        { label: "Bank / ATM",         icon: Landmark,     color: "bg-yellow-100 text-yellow-600" },
  government:  { label: "Government Office",  icon: Building2,    color: "bg-purple-100 text-purple-600" },
  transport:   { label: "Transport",          icon: Bus,          color: "bg-orange-100 text-orange-600" },
  education:   { label: "School / College",   icon: GraduationCap,color: "bg-cyan-100 text-cyan-600" },
  electricity: { label: "Electricity",        icon: Zap,          color: "bg-amber-100 text-amber-600" },
  water:       { label: "Water Board",        icon: Droplets,     color: "bg-teal-100 text-teal-600" },
  other:       { label: "Other",              icon: HelpCircle,   color: "bg-gray-100 text-gray-600" },
};

const BLANK = {
  name: "", service_type: "hospital" as ServiceType,
  phone: "", address: "", timings: "", is_emergency: false,
};

export default function AgentServicesPage() {
  const supabase = createClient();
  const [services, setServices]   = useState<LocalService[]>([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter]       = useState<ServiceType | "all" | "emergency">("all");
  const [form, setForm]           = useState(BLANK);
  const [error, setError]         = useState("");
  const [villageId, setVillageId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    // Fetch all active services (global + village-specific)
    const { data } = await supabase
      .from("local_services")
      .select("*")
      .eq("is_active", true)
      .order("is_emergency", { ascending: false })
      .order("service_type")
      .order("name");
    setServices((data as LocalService[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    // Get agent's village for new service entries
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("agents").select("assigned_villages").eq("user_id", user.id).single()
        .then(({ data }) => {
          if (data?.assigned_villages?.[0]) setVillageId(data.assigned_villages[0]);
        });
    });
  }, [load, supabase]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    setError(""); setSubmitting(true);
    const { error: err } = await supabase.from("local_services").insert({
      name:         form.name.trim(),
      service_type: form.service_type,
      phone:        form.phone.trim() || null,
      address:      form.address.trim() || null,
      timings:      form.timings.trim() || null,
      is_emergency: form.is_emergency,
      village_id:   villageId,
      is_active:    true,
    });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    setForm(BLANK);
    setAdding(false);
    load();
  };

  const visible = services.filter((s) => {
    if (filter === "all") return true;
    if (filter === "emergency") return s.is_emergency;
    return s.service_type === filter;
  });

  const grouped = visible.reduce<Record<string, LocalService[]>>((acc, s) => {
    const key = s.is_emergency ? "__emergency__" : s.service_type;
    (acc[key] ??= []).push(s);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Local Services</h1>
          <p className="text-sm text-gray-400 mt-0.5">Directory of local authorities and services in your area</p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="btn-primary gap-2 text-sm py-2"
        >
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      {/* Add service form */}
      {adding && (
        <form onSubmit={handleAdd} className="card p-5 space-y-4 border-2 border-brand-200">
          <h2 className="font-semibold text-gray-900 text-sm">Add a Local Service</h2>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠️ {error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Service Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. PHC Miryalaguda" className="input text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
              <select value={form.service_type}
                onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value as ServiceType }))}
                className="input text-sm">
                {Object.entries(TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Phone number" type="tel" className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Timings</label>
              <input value={form.timings} onChange={(e) => setForm((f) => ({ ...f, timings: e.target.value }))}
                placeholder="e.g. 9 AM – 5 PM, Mon–Sat" className="input text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Full address" className="input text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.is_emergency}
              onChange={(e) => setForm((f) => ({ ...f, is_emergency: e.target.checked }))}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            Mark as Emergency Contact (shown at top)
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="btn-primary text-sm py-2 gap-2 disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Service"}
            </button>
            <button type="button" onClick={() => { setAdding(false); setError(""); }} className="btn-ghost text-sm py-2">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {(["all", "emergency", ...Object.keys(TYPE_META)] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f as typeof filter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              filter === f
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
            }`}>
            {f === "all" ? "All Services" : f === "emergency" ? "🚨 Emergency" : TYPE_META[f as ServiceType].label}
          </button>
        ))}
      </div>

      {/* Emergency quick-dial banner */}
      {(filter === "all" || filter === "emergency") && grouped["__emergency__"]?.length > 0 && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Emergency Contacts
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {grouped["__emergency__"].map((s) => (
              <a key={s.id} href={`tel:${s.phone}`}
                className="flex flex-col items-center gap-1 rounded-xl bg-white border border-red-100 p-3 hover:bg-red-50 transition-colors text-center">
                <span className="text-xl">🆘</span>
                <p className="text-xs font-semibold text-gray-800 leading-tight">{s.name}</p>
                <p className="text-sm font-bold text-red-600">{s.phone}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Regular services by type */}
      {visible.filter((s) => !s.is_emergency).length === 0 && filter !== "emergency" && (
        <div className="card p-12 text-center">
          <HelpCircle className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No services found. Add the first one!</p>
        </div>
      )}

      {Object.entries(grouped)
        .filter(([key]) => key !== "__emergency__")
        .map(([type, items]) => {
          const meta = TYPE_META[type as ServiceType];
          const Icon = meta.icon;
          return (
            <div key={type} className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                {meta.label}
                <span className="text-xs text-gray-400">({items.length})</span>
              </h2>
              <div className="space-y-2">
                {items.map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      {s.address && <p className="text-xs text-gray-400 mt-0.5 truncate">{s.address}</p>}
                      {s.timings && <p className="text-xs text-gray-400">{s.timings}</p>}
                    </div>
                    {s.phone && (
                      <a href={`tel:${s.phone}`}
                        className="flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 hover:bg-gray-100 transition-colors shrink-0">
                        <Phone className="h-3.5 w-3.5" /> {s.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
