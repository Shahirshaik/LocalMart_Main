"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, ArrowLeft, Upload, ChevronRight } from "lucide-react";
import { IndiaLocationPicker, type LocationValue } from "@/components/ui/IndiaLocationPicker";

type PriceType = "fixed" | "negotiable" | "free";
type ListingType = "sell" | "buy" | "rent" | "service";

interface Category { id: string; name_en: string; slug: string; icon: string }

const TYPE_OPTIONS: { value: ListingType; label: string; icon: string; desc: string }[] = [
  { value: "sell",    label: "For Sale",     icon: "🏷️", desc: "I want to sell something" },
  { value: "buy",     label: "Want to Buy",  icon: "🛒", desc: "I'm looking to buy" },
  { value: "rent",    label: "For Rent",     icon: "🔑", desc: "Available on rent" },
  { value: "service", label: "Service",      icon: "🔧", desc: "I offer a service" },
];

const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: "fixed",      label: "Fixed Price" },
  { value: "negotiable", label: "Negotiable" },
  { value: "free",       label: "Free" },
];

const EMPTY_LOCATION: LocationValue = { state: "", district: "", city: "", area: "", pin_code: "" };

export default function NewListingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [newId, setNewId] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "sell" as ListingType,
    price: "",
    price_type: "fixed" as PriceType,
    category_id: "",
    contact_phone: "",
    whatsapp_number: "",
    tags: "",
  });
  const [location, setLocation] = useState<LocationValue>(EMPTY_LOCATION);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name_en, slug, icon")
      .eq("is_active", true)
      .order("name_en")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim())     { setError("Title is required."); return; }
    if (!form.category_id)      { setError("Please select a category."); return; }
    if (!location.state)        { setError("Please select your State."); return; }
    if (!location.district.trim()) { setError("Please enter your District."); return; }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login?next=/listings/new"); return; }

    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

    // Build description with location context so it's stored even before migration runs
    const locationSuffix = [location.area, location.city, location.district, location.state, location.pin_code]
      .filter(Boolean).join(", ");
    const fullDescription = [form.description.trim(), locationSuffix ? `📍 ${locationSuffix}` : ""]
      .filter(Boolean).join("\n\n");

    // Base insert that works with the CURRENT database schema
    const insertPayload: Record<string, unknown> = {
      title:           form.title.trim(),
      description:     fullDescription || null,
      type:            form.type,
      price:           form.price ? Number(form.price) : null,
      price_type:      form.price_type,
      category_id:     form.category_id,
      contact_phone:   form.contact_phone.trim() || null,
      whatsapp_number: form.whatsapp_number.trim() || null,
      tags:            tags.length ? tags : null,
      seller_id:       user.id,
      status:          "pending",
      view_count:      0,
    };

    // Try to add the extended location columns (available after migration)
    // If columns don't exist Supabase will ignore unknown keys only via the upsert path,
    // so we probe first then add them.
    try {
      const { error: probeErr } = await supabase
        .from("listings").select("state").limit(1);
      if (!probeErr) {
        insertPayload.state    = location.state    || null;
        insertPayload.district = location.district || null;
        insertPayload.city     = location.city     || null;
        insertPayload.area     = location.area     || null;
        insertPayload.pin_code = location.pin_code || null;
      }
    } catch { /* columns not yet available */ }

    // village_id: try to find a matching village, else use first available as placeholder
    const { data: villages } = await supabase.from("villages").select("id").limit(1);
    const fallbackVillageId = villages?.[0]?.id ?? null;
    // Only set village_id if we have one (column is NOT NULL in schema)
    if (fallbackVillageId) insertPayload.village_id = fallbackVillageId;

    const { data, error: err } = await supabase.from("listings")
      .insert(insertPayload).select("id").single();

    setLoading(false);
    if (err) { setError(err.message); return; }
    setNewId(data?.id ?? "");
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full text-center animate-fade-in">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Submitted! 🎉</h1>
          <p className="text-gray-500 text-sm mb-2">
            Your listing is under review and will go live once approved by our team.
          </p>
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-6 inline-block">
            ⏳ Usually approved within a few hours
          </p>
          <div className="flex flex-col gap-2.5">
            {newId && (
              <Link href={"/listings/" + newId} className="btn-primary justify-center">
                View My Listing <ChevronRight className="h-4 w-4" />
              </Link>
            )}
            <Link href="/my-listings" className="btn-secondary justify-center">
              My Listings Dashboard
            </Link>
            <button
              onClick={() => { setSuccess(false); setForm({ title: "", description: "", type: "sell", price: "", price_type: "fixed", category_id: "", contact_phone: "", whatsapp_number: "", tags: "" }); setLocation(EMPTY_LOCATION); }}
              className="btn-ghost justify-center">
              Post Another Listing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-3.5 flex items-center gap-3">
          <Link href="/listings" className="btn-ghost p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-gray-900">Post a Free Listing</h1>
            <p className="text-xs text-gray-400">Reach buyers in your area instantly</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              {error}
            </div>
          )}

          {/* ── Step 1: Listing Type ── */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white text-xs mr-2">1</span>
              What are you posting?
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((t) => (
                <button key={t.value} type="button" onClick={() => set("type", t.value)}
                  className={"flex items-center gap-3 rounded-xl p-3 border-2 transition-all text-left " + (
                    form.type === t.value
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-200 bg-white hover:border-brand-300"
                  )}>
                  <span className="text-xl">{t.icon}</span>
                  <div>
                    <p className={"text-sm font-semibold " + (form.type === t.value ? "text-brand-700" : "text-gray-800")}>
                      {t.label}
                    </p>
                    <p className="text-xs text-gray-400">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Step 2: Basic Details ── */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white text-xs mr-2">2</span>
              Listing Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal text-xs ml-1">({form.title.length}/120)</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Honda Activa 2022 for sale, Rice crop available, Home tuition..."
                className="input"
                maxLength={120}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category_id}
                onChange={(e) => set("category_id", e.target.value)}
                className="input"
                required
              >
                <option value="">Select a category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
                <span className="text-gray-400 font-normal text-xs ml-1">({form.description.length}/2000)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                placeholder="Describe your item or service — condition, features, why you're selling..."
                className="input resize-none"
                maxLength={2000}
              />
            </div>
          </div>

          {/* ── Step 3: Price ── */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white text-xs mr-2">3</span>
              Price
            </h2>

            <div className="flex gap-2 flex-wrap">
              {PRICE_TYPES.map((pt) => (
                <button key={pt.value} type="button" onClick={() => set("price_type", pt.value)}
                  className={"px-4 py-2 rounded-xl text-sm font-medium border transition-all " + (
                    form.price_type === pt.value
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
                  )}>
                  {pt.label}
                </button>
              ))}
            </div>

            {form.price_type !== "free" && (
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="Enter amount"
                  className="input pl-7"
                  min="0"
                />
              </div>
            )}
            {form.price_type === "free" && (
              <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                ✅ This listing will be marked as Free
              </p>
            )}
          </div>

          {/* ── Step 4: Location ── */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white text-xs mr-2">4</span>
              Your Location <span className="text-red-500">*</span>
            </h2>
            <IndiaLocationPicker value={location} onChange={setLocation} required />
          </div>

          {/* ── Step 5: Contact ── */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white text-xs mr-2">5</span>
              Contact Info
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number</label>
                <input
                  value={form.contact_phone}
                  onChange={(e) => set("contact_phone", e.target.value)}
                  placeholder="+91 9999999999"
                  className="input"
                  type="tel"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">WhatsApp</label>
                <input
                  value={form.whatsapp_number}
                  onChange={(e) => set("whatsapp_number", e.target.value)}
                  placeholder="+91 9999999999"
                  className="input"
                  type="tel"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Tags <span className="text-gray-400">(comma-separated, optional)</span>
              </label>
              <input
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="e.g. organic, urgent, brand-new, second-hand"
                className="input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-4 text-base font-semibold disabled:opacity-60 animate-pulse-glow">
            <Upload className="h-4 w-4" />
            {loading ? "Submitting..." : "Submit Free Listing"}
          </button>

          <p className="text-center text-xs text-gray-400 pb-6">
            Free to post · Reviewed by our team · Usually approved within hours
          </p>
        </form>
      </div>
    </div>
  );
}
