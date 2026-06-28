import { createClient } from "@/lib/supabase/server";

export default async function CEOLocationsPage() {
  const supabase = await createClient();

  const [statesRes, districtsRes, pinsRes, listingsByPinRes] = await Promise.all([
    supabase.from("india_states").select("id,name,code,region,is_ut").order("name"),
    supabase.from("india_districts").select("id,name,state_id,india_states!inner(name,code)").order("name").limit(200),
    supabase.from("india_pin_codes").select("pin_code,district_id,city,village,lat,lng").limit(300),
    supabase.from("listings")
      .select("pin_code,status")
      .eq("status","active")
      .limit(500),
  ]);

  const states    = statesRes.data    ?? [];
  const districts = districtsRes.data ?? [];
  const pins      = pinsRes.data      ?? [];
  const listings  = listingsByPinRes.data ?? [];

  // Listings per PIN
  const listingsPerPin: Record<string, number> = {};
  for (const l of listings) {
    if (l.pin_code) listingsPerPin[l.pin_code] = (listingsPerPin[l.pin_code] ?? 0) + 1;
  }

  // Districts per state
  const districtsByState: Record<number, number> = {};
  for (const d of districts) districtsByState[d.state_id] = (districtsByState[d.state_id] ?? 0) + 1;

  // PINs per district
  const pinsByDistrict: Record<number, number> = {};
  for (const p of pins) if (p.district_id) pinsByDistrict[p.district_id] = (pinsByDistrict[p.district_id] ?? 0) + 1;

  const regions = [...new Set(states.map(s => s.region))].filter(Boolean).sort();

  // Top covered PINs
  const topPins = Object.entries(listingsPerPin)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  // Coverage score: active PINs / total PINs
  const activePins  = Object.keys(listingsPerPin).length;
  const totalPins   = pins.length;
  const coverage    = totalPins > 0 ? ((activePins / totalPins) * 100).toFixed(1) : "0";

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">India Locations</h1>
          <p className="text-xs text-gray-500 mt-0.5">State → District → Taluk → Village → PIN</p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="stat-card py-2 px-4 text-center">
            <div className="text-xl font-black text-gray-900">{states.length}</div>
            <div className="text-gray-400">States / UTs</div>
          </div>
          <div className="stat-card py-2 px-4 text-center">
            <div className="text-xl font-black text-gray-900">{districts.length}</div>
            <div className="text-gray-400">Districts</div>
          </div>
          <div className="stat-card py-2 px-4 text-center">
            <div className="text-xl font-black text-gray-900">{totalPins}</div>
            <div className="text-gray-400">PIN Codes</div>
          </div>
          <div className="stat-card py-2 px-4 text-center">
            <div className="text-xl font-black text-brand-600">{coverage}%</div>
            <div className="text-gray-400">Coverage</div>
          </div>
        </div>
      </div>

      <div className="dash-page space-y-6">
        {/* Coverage bar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900 text-sm">📍 PIN Code Coverage</h2>
            <span className="text-xs text-gray-500">{activePins} active / {totalPins} total</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="h-3 rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all"
              style={{ width: `${coverage}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {totalPins - activePins} PIN codes have zero active listings — potential expansion territory.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* States by region */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">🗺️ States by Region</h2>
            {regions.map(region => {
              const regionStates = states.filter(s => s.region === region);
              return (
                <div key={region} className="mb-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{region}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {regionStates.map(s => (
                      <span key={s.id}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${s.is_ut ? "bg-amber-100 text-amber-700" : "bg-brand-50 text-brand-700"}`}
                        title={s.name}>
                        {s.code}
                        {districtsByState[s.id] ? <span className="ml-1 opacity-60">{districtsByState[s.id]}</span> : null}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top covered PINs */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">🏆 Most Active PIN Codes</h2>
            <div className="space-y-2">
              {topPins.map(([pin, count], i) => {
                const pinData = pins.find(p => p.pin_code === pin);
                return (
                  <div key={pin} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
                    <div className="font-mono text-sm font-bold text-gray-900 w-16">{pin}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 truncate">{pinData?.city || pinData?.village || "—"}</div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div className="h-1.5 rounded-full bg-brand-500"
                          style={{ width: `${(count / (topPins[0]?.[1] ?? 1)) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-600 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Districts table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Districts ({districts.length})</h2>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DISTRICT</th>
                  <th>STATE</th>
                  <th>PIN CODES</th>
                  <th>ACTIVE LISTINGS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {districts.map(d => {
                  const state        = (d.india_states as unknown as { name: string; code: string }) ?? { name: "—", code: "?" };
                  const pinCount     = pinsByDistrict[d.id] ?? 0;
                  const distPins     = pins.filter(p => p.district_id === d.id).map(p => p.pin_code);
                  const activeCount  = distPins.reduce((s, p) => s + (listingsPerPin[p] ?? 0), 0);
                  return (
                    <tr key={d.id}>
                      <td className="font-medium text-gray-900 text-sm">{d.name}</td>
                      <td>
                        <span className="text-xs bg-brand-50 text-brand-700 rounded px-2 py-0.5 font-semibold">{state.code}</span>
                        <span className="text-xs text-gray-400 ml-1">{state.name}</span>
                      </td>
                      <td className="text-sm text-gray-700">{pinCount}</td>
                      <td>
                        <span className={`font-bold text-sm ${activeCount > 0 ? "text-green-600" : "text-gray-400"}`}>
                          {activeCount}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${activeCount > 10 ? "status-active" : activeCount > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400"}`}>
                          {activeCount > 10 ? "Active" : activeCount > 0 ? "Partial" : "Empty"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
