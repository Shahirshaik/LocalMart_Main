import { createClient } from "@/lib/supabase/server";
import { MapPin, CheckCircle, XCircle } from "lucide-react";

export default async function DashboardVillagesPage() {
  const supabase = await createClient();

  const { data: villages, count } = await supabase
    .from("villages")
    .select("*, listing_count:listings(count)", { count: "exact" })
    .order("name");

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-brand-600" /> Villages
        </h1>
        <span className="text-sm text-gray-400">{count ?? 0} villages</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {villages && villages.length > 0 ? villages.map((v) => (
          <div key={v.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="font-semibold text-gray-900">{v.name}</h2>
                <p className="text-xs text-gray-400">{v.district}, {v.state}</p>
              </div>
              {v.is_active ? (
                <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Active
                </span>
              ) : (
                <span className="badge bg-gray-100 text-gray-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Inactive
                </span>
              )}
            </div>
            {v.description && <p className="text-xs text-gray-500 line-clamp-2 mt-1">{v.description}</p>}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
              <span className="text-xs text-gray-400">Population:</span>
              <span className="text-xs font-medium text-gray-700">{v.population?.toLocaleString() ?? "—"}</span>
              {v.pincode && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400">PIN: {v.pincode}</span>
                </>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-16 text-gray-400">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>No villages found. Add them via your Supabase dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}
