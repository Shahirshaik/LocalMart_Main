import { createClient } from "@/lib/supabase/server";
import { IndianRupee, TrendingUp, Users, Copy, Star, Calendar } from "lucide-react";

function EarnCard({ label, value, sub, color = "brand" }: {
  label: string; value: string; sub?: string;
  color?: "brand" | "green" | "orange" | "blue";
}) {
  const colors = {
    brand:  "bg-brand-50  text-brand-600",
    green:  "bg-green-50  text-green-600",
    orange: "bg-orange-50 text-orange-600",
    blue:   "bg-blue-50   text-blue-600",
  };
  return (
    <div className="card p-5">
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${colors[color].split(" ")[1]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  commission:     "Deal Commission",
  referral_bonus: "Referral Bonus",
  task_bonus:     "Task Bonus",
  daily_bonus:    "Daily Bonus",
};

const TYPE_COLORS: Record<string, string> = {
  commission:     "bg-green-100  text-green-700",
  referral_bonus: "bg-purple-100 text-purple-700",
  task_bonus:     "bg-blue-100   text-blue-700",
  daily_bonus:    "bg-orange-100 text-orange-700",
};

export default async function AgentEarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: agent } = await supabase
    .from("agents")
    .select("id, commission_pct, referral_code, rating, rating_count")
    .eq("user_id", user.id)
    .single();

  if (!agent) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-400">Agent profile not found. Contact the CEO.</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [
    { data: allEarnings },
    { data: referrals },
    { count: closedCount },
  ] = await Promise.all([
    supabase.from("agent_earnings")
      .select("id, amount, type, description, earned_at, listing:listings!agent_earnings_listing_id_fkey(title)")
      .eq("agent_id", agent.id)
      .order("earned_at", { ascending: false })
      .limit(50),
    supabase.from("agent_referrals")
      .select("id, status, bonus_amount, created_at, referred_user:users!agent_referrals_referred_user_id_fkey(full_name)")
      .eq("referrer_agent_id", agent.id)
      .order("created_at", { ascending: false }),
    supabase.from("contact_requests")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", agent.id)
      .eq("status", "closed"),
  ]);

  const sum = (rows: typeof allEarnings, from: string) =>
    (rows ?? []).filter((r) => r.earned_at >= from).reduce((a, r) => a + Number(r.amount), 0);

  const todayTotal   = sum(allEarnings, today);
  const weekTotal    = sum(allEarnings, weekAgo);
  const monthTotal   = sum(allEarnings, monthAgo);
  const allTimeTotal = (allEarnings ?? []).reduce((a, r) => a + Number(r.amount), 0);

  const referralCode = agent.referral_code ?? user.id.slice(0, 8).toUpperCase();
  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/signup?ref=${referralCode}`;

  const activeReferrals  = (referrals ?? []).filter((r) => r.status === "active").length;
  const referralEarnings = (referrals ?? []).filter((r) => r.status === "rewarded")
    .reduce((a, r) => a + Number(r.bonus_amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <IndianRupee className="h-6 w-6 text-brand-600" /> My Earnings
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Your commission rate: <strong>{agent.commission_pct ?? 5}%</strong> per closed deal
          {agent.rating && (
            <span className="ml-3 text-amber-500 flex items-center gap-1 inline-flex">
              <Star className="h-3.5 w-3.5 fill-amber-400" /> {Number(agent.rating).toFixed(1)} ({agent.rating_count ?? 0} reviews)
            </span>
          )}
        </p>
      </div>

      {/* Earning summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <EarnCard label="Today"    value={`₹${todayTotal.toLocaleString("en-IN")}`}   color="brand" />
        <EarnCard label="This Week" value={`₹${weekTotal.toLocaleString("en-IN")}`}   color="green" />
        <EarnCard label="This Month" value={`₹${monthTotal.toLocaleString("en-IN")}`} color="orange" />
        <EarnCard label="All Time"  value={`₹${allTimeTotal.toLocaleString("en-IN")}`} sub={`${closedCount ?? 0} deals closed`} color="blue" />
      </div>

      {/* Referral programme */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-500" /> Agent Referral Programme
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            Earn <strong className="text-green-600">₹100</strong> per active agent you refer
          </div>
        </div>

        <div className="bg-brand-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium text-gray-600">Your referral link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-brand-200 rounded-lg px-3 py-2 text-brand-700 font-mono truncate">
              {referralLink}
            </code>
            <button
              onClick={() => {}}
              title="Copy link"
              className="h-8 w-8 rounded-lg border border-brand-200 bg-white flex items-center justify-center hover:bg-brand-100 transition-colors shrink-0"
            >
              <Copy className="h-3.5 w-3.5 text-brand-600" />
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            Share this link · when the new agent activates, you get ₹100 bonus credited automatically
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-lg font-bold text-gray-900">{(referrals ?? []).length}</p>
            <p className="text-xs text-gray-400">Total Referred</p>
          </div>
          <div className="rounded-xl bg-green-50 p-3">
            <p className="text-lg font-bold text-green-700">{activeReferrals}</p>
            <p className="text-xs text-gray-400">Active Agents</p>
          </div>
          <div className="rounded-xl bg-brand-50 p-3">
            <p className="text-lg font-bold text-brand-700">₹{referralEarnings.toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400">Bonus Earned</p>
          </div>
        </div>

        {(referrals ?? []).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600">Referral History</p>
            {(referrals ?? []).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-gray-800 text-xs">{(r.referred_user as { full_name: string | null } | null)?.full_name ?? "—"}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`badge text-[10px] ${
                  r.status === "rewarded" ? "bg-green-100 text-green-700" :
                  r.status === "active"   ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-500"
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Earnings log */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand-500" /> Earnings History
        </h2>
        {(allEarnings ?? []).length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400">
            No earnings yet — close your first deal to start earning!
          </p>
        ) : (
          <div className="space-y-2">
            {(allEarnings ?? []).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.description ?? (e.listing as { title: string } | null)?.title ?? "—"}</p>
                  <p className="text-xs text-gray-400">{new Date(e.earned_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">+₹{Number(e.amount).toLocaleString("en-IN")}</p>
                  <span className={`badge text-[10px] ${TYPE_COLORS[e.type] ?? "bg-gray-100 text-gray-600"}`}>
                    {TYPE_LABELS[e.type] ?? e.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
