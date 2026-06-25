"use client";

import { MapPin, ChevronDown } from "lucide-react";
import { AP_DISTRICTS, AP_MANDALS, AP_VILLAGES, AP_MANDAL_PINS } from "@/data/ap-locations";

export const INDIA_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh",
  "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand",
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

export interface LocationValue {
  state: string;
  district: string;
  city: string;   // mandal name for AP
  area: string;   // village name
  pin_code: string;
}

interface Props {
  value: LocationValue;
  onChange: (val: LocationValue) => void;
  required?: boolean;
}

const isAP = (state: string) => state === "Andhra Pradesh";

// Dropdown wrapper with chevron icon
function SelectField({
  label, value, onChange, options, placeholder, required, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string; required?: boolean; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className={"input appearance-none pr-9 " + (disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "")}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

function TextField({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}

export function IndiaLocationPicker({ value, onChange, required }: Props) {
  const ap = isAP(value.state);
  const apDistricts  = ap ? AP_DISTRICTS : [];
  const apMandals    = ap && value.district ? (AP_MANDALS[value.district] ?? []) : [];
  const apVillages   = ap && value.city     ? (AP_VILLAGES[value.city]    ?? []) : [];

  const set = (field: keyof LocationValue, v: string) => {
    const updated = { ...value, [field]: v };
    // Cascade reset downstream when a parent changes
    if (field === "state")    { updated.district = ""; updated.city = ""; updated.area = ""; updated.pin_code = ""; }
    if (field === "district") { updated.city = ""; updated.area = ""; updated.pin_code = ""; }
    if (field === "city") {
      updated.area = "";
      // Auto-fill PIN when AP mandal is known
      if (ap && AP_MANDAL_PINS[v]) updated.pin_code = AP_MANDAL_PINS[v];
      else updated.pin_code = "";
    }
    onChange(updated);
  };

  // Build full address preview
  const addressParts = [value.area, value.city, value.district, value.state, value.pin_code ? `PIN: ${value.pin_code}` : ""]
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <MapPin className="h-4 w-4 text-brand-500" />
        Location {required && <span className="text-red-500">*</span>}
        {ap && (
          <span className="ml-auto text-xs font-normal text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
            🏠 Andhra Pradesh mode
          </span>
        )}
      </div>

      {/* ── State ── */}
      <SelectField
        label="State / UT"
        value={value.state}
        onChange={(v) => set("state", v)}
        options={INDIA_STATES}
        placeholder="Select your State or UT..."
        required={required}
      />

      {/* ── District ── */}
      {ap ? (
        <SelectField
          label="District"
          value={value.district}
          onChange={(v) => set("district", v)}
          options={apDistricts}
          placeholder="Select District..."
          required={required}
          disabled={!value.state}
        />
      ) : (
        <TextField
          label="District"
          value={value.district}
          onChange={(v) => set("district", v)}
          placeholder="e.g. Kurnool, Vijayawada..."
        />
      )}

      {/* ── Mandal / City ── */}
      {ap && value.district ? (
        apMandals.length > 0 ? (
          <SelectField
            label="Mandal"
            value={value.city}
            onChange={(v) => set("city", v)}
            options={apMandals}
            placeholder="Select Mandal..."
          />
        ) : (
          <TextField
            label="Mandal"
            value={value.city}
            onChange={(v) => set("city", v)}
            placeholder="Enter mandal name..."
          />
        )
      ) : !ap && value.state ? (
        <TextField
          label="City / Town"
          value={value.city}
          onChange={(v) => set("city", v)}
          placeholder="e.g. Ongole, Vijayawada..."
        />
      ) : null}

      {/* ── Village ── */}
      {ap && value.city ? (
        apVillages.length > 0 ? (
          <SelectField
            label="Village"
            value={value.area}
            onChange={(v) => set("area", v)}
            options={apVillages}
            placeholder="Select Village..."
          />
        ) : (
          <TextField
            label="Village"
            value={value.area}
            onChange={(v) => set("area", v)}
            placeholder="Enter village name..."
          />
        )
      ) : !ap && value.state ? (
        <TextField
          label="Village / Area / Locality"
          value={value.area}
          onChange={(v) => set("area", v)}
          placeholder="e.g. your village or street area..."
        />
      ) : null}

      {/* ── PIN Code ── */}
      {(value.city || value.district) && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            PIN Code
            {ap && value.city && AP_MANDAL_PINS[value.city] && (
              <span className="ml-1.5 text-brand-500 font-normal">✓ auto-filled</span>
            )}
          </label>
          <input
            value={value.pin_code}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 6);
              onChange({ ...value, pin_code: v });
            }}
            placeholder="6-digit PIN code"
            className="input"
            inputMode="numeric"
            maxLength={6}
          />
        </div>
      )}

      {/* ── Address Preview ── */}
      {addressParts.length >= 2 && (
        <div className="flex items-start gap-2 bg-brand-50 border border-brand-100 rounded-xl px-3 py-2.5">
          <MapPin className="h-3.5 w-3.5 text-brand-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Your address preview</p>
            <p className="text-xs font-semibold text-brand-700">{addressParts.join(", ")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Format a location object into a short display string */
export function formatLocation(l: Partial<LocationValue> | null | undefined): string {
  if (!l) return "";
  return [l.area, l.city, l.district, l.state]
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
}
