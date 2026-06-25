import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, Phone, MapPin, CheckCircle, XCircle } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default async function DashboardAgentsPage() {
  const supabase = await createClient();

  const { data: agents } = await supabase
    .from("agents")
    .select("*, user:users(full_name, email, phone), village:villages(name, district)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-brand-600" /> Agents
        </h1>
        <span className="text-sm text-gray-400">{agents?.length ?? 0} agents</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agent</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Village</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Commission</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agents && agents.length > 0 ? agents.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{a.user?.full_name ?? a.user?.email ?? "—"}</p>
                    <p className="text-xs text-gray-400">{a.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-3.5 w-3.5 text-brand-400" />
                      {a.village?.name ?? "—"}, {a.village?.district ?? ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.user?.phone ? (
                      <a href={`tel:${a.user.phone}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                        <Phone className="h-3.5 w-3.5" /> {a.user.phone}
                      </a>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{a.commission_rate ?? 0}%</td>
                  <td className="px-4 py-3">
                    {a.is_active ? (
                      <span className="badge bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                        <CheckCircle className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-500 flex items-center gap-1 w-fit">
                        <XCircle className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{timeAgo(a.created_at)}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No agents yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
