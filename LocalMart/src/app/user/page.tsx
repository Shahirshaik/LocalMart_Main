import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import UserNavbar from "@/components/user/UserNavbar";
import CategoryStrip from "@/components/user/CategoryStrip";
import RecommendationsFeed from "@/components/user/RecommendationsFeed";
import NotificationsPanel from "@/components/user/NotificationsPanel";
import AIBrokerBadge from "@/components/user/AIBrokerBadge";

interface Listing {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  created_at: string;
  category?: string | null;
  is_featured?: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700",
  active:   "bg-green-100 text-green-700",
  sold:     "bg-gray-100 text-gray-600",
  expired:  "bg-red-100 text-red-700",
  draft:    "bg-blue-100 text-blue-700",
};

export default async function UserDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileRes, myListingsRes, recentListingsRes, convCountRes, notifCountRes] = await Promise.all([
    supabase.from("users").select("full_name, village_id, role").eq("id", user!.id).single(),
    supabase.from("listings")
      .select("id, title, status, created_at")
      .eq("seller_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("listings")
      .select("id, title, price, status, created_at, category, is_featured")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("conversations")
      .select("buyer_unread, seller_unread, buyer_id, seller_id")
      .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`),
    supabase.from("notifications")
      .select("id", { count: "exact" })
      .eq("user_id", user!.id)
      .eq("is_read", false),
  ]);

  const profile    = profileRes.data;
  const myListings = myListingsRes.data ?? [];
  const recent     = (recentListingsRes.data ?? []) as unknown as Listing[];

  // Count unread messages across all conversations
  const unreadMessages = (convCountRes.data ?? []).reduce((sum, c) => {
    const isBuyer = c.buyer_id === user!.id;
    return sum + (isBuyer ? c.buyer_unread : c.seller_unread);
  }, 0);
  const unreadNotifs = notifCountRes.count ?? 0;

  // Check if user has any AI proxy active conversations
  const aiActiveRes = await supabase
    .from("conversations")
    .select("id")
    .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
    .eq("ai_proxy_active", true)
    .limit(1);
  const hasAIProxy = (aiActiveRes.data?.length ?? 0) > 0;

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div>
      {/* Sticky OLX-style navbar replaces old dash-topbar */}
      <UserNavbar
        userName={profile?.full_name}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifs}
      />

      <div className="dash-page space-y-0">

        {/* Welcome banner */}
        <div className="flex items-center justify-between pt-2 pb-1">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Browse marketplace · Post listings · Contact agents
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasAIProxy && <AIBrokerBadge animated negotiating />}
            <Link href="/listings/new" className="btn-royal text-xs px-4 py-2">
              + Post Free Ad
            </Link>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 py-4">
          {[
            { icon: "📋", label: "My Listings", value: myListings.length, href: "/my-listings" },
            { icon: "✅", label: "Active Ads",  value: myListings.filter((l) => l.status === "active").length, href: "/my-listings" },
            { icon: "🛒", label: "Marketplace",  value: `${recent.length}+`, href: "/listings" },
          ].map((s) => (
            <Link key={s.label} href={s.href}
              className="stat-card border-l-4 border-l-purple-400 text-center hover:no-underline">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </Link>
          ))}
        </div>

        {/* Category strip */}
        <CategoryStrip />

        {/* Recommendations feed */}
        <RecommendationsFeed listings={recent} />

        {/* Bottom section: My Listings + Notifications */}
        <div className="grid lg:grid-cols-2 gap-6 pb-8">

          {/* My listings */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">📋 My Listings</h2>
              <Link href="/my-listings" className="text-xs text-purple-600 font-semibold">
                All →
              </Link>
            </div>
            {myListings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm text-gray-500 mb-4">You haven't posted anything yet</p>
                <Link href="/listings/new" className="btn-royal text-xs px-4 py-2">
                  Post First Listing
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {myListings.map((l) => (
                  <div key={l.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate text-gray-800">{l.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(l.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                    <span className={`badge ml-3 shrink-0 ${STATUS_COLOR[l.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications panel */}
          <NotificationsPanel userId={user!.id} compact />
        </div>

        {/* Hero CTA */}
        <div className="rounded-2xl p-6 mb-4" style={{ background: "linear-gradient(135deg,#1E0A3C,#4C1D95)" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-lg mb-1">
                Sell, rent or offer services — reach all of Bharat
              </h3>
              <p className="text-purple-300 text-sm">
                Free listing. A local agent connects you with buyers instantly.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/listings/new"
                className="text-xs font-bold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
                style={{ background: "#F59E0B", color: "#1E0A3C" }}>
                Post Free Now ⚡
              </Link>
              <Link href="/listings"
                className="text-xs font-semibold px-5 py-2.5 rounded-xl border border-purple-600 text-purple-200 hover:bg-white/10 transition-all">
                Browse First
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
