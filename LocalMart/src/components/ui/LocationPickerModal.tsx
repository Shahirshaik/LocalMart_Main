"use client";

import { useState } from "react";
import { X, MapPin, Search } from "lucide-react";

const LOCATION_KEY = "lm_location";

const POPULAR_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai",
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
  "Surat", "Kochi", "Indore", "Bhopal", "Visakhapatnam",
  "Vijayawada", "Guntur", "Rajahmundry", "Tirupati", "Nellore",
];

interface Props {
  onClose: () => void;
  onSelect: (label: string) => void;
}

export function LocationPickerModal({ onClose, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");

  function handleSelect(city: string) {
    setSelected(city);
    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify({ city, state: "", district: "", area: "", pin_code: "" }));
    } catch {}
    onSelect(city);
  }

  function handleCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => handleSelect("My Location"),
      () => {}
    );
  }

  const filtered = POPULAR_CITIES.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:items-center md:justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full bg-white rounded-t-2xl overflow-hidden flex flex-col
        md:rounded-2xl md:shadow-2xl md:max-w-[480px] md:max-h-[600px] mt-auto md:mt-0">

        {/* Handle bar (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Select Location</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Use current location */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={handleCurrentLocation}
              className="flex items-center gap-3 text-sm font-semibold min-h-[44px] w-full text-left"
              style={{ color: "#7C3AED" }}
            >
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" style={{ color: "#7C3AED" }} />
              </div>
              Use my current location
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search city, area..."
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ height: 28 }}
                autoFocus
              />
            </div>
          </div>

          {/* Popular cities */}
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Popular Cities
            </p>
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(city => (
                <button
                  key={city}
                  onClick={() => handleSelect(city)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-medium text-left transition-all min-h-[44px] ${
                    selected === city
                      ? "bg-purple-50 border border-purple-200 text-purple-700"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="flex-1">{city}</span>
                  {selected === city && <span style={{ color: "#7C3AED" }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
