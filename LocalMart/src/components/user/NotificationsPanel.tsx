"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, Clock, Bot, MapPin, MessageCircle, Star, AlertCircle, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

type NotifType =
  | "ad_waiting"
  | "ad_approved"
  | "ad_live"
  | "ad_expired"
  | "new_message"
  | "price_offer"
  | "ai_optimized"
  | "ai_negotiating";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  meta?: Record<string, string>;
}

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; bg: string; color: string }> = {
  ad_waiting:      { icon: Clock,          bg: "bg-amber-50",  color: "text-amber-600" },
  ad_approved:     { icon: Star,           bg: "bg-green-50",  color: "text-green-600" },
  ad_live:         { icon: TrendingUp,     bg: "bg-green-50",  color: "text-green-700" },
  ad_expired:      { icon: AlertCircle,    bg: "bg-red-50",    color: "text-red-600" },
  new_message:     { icon: MessageCircle,  bg: "bg-blue-50",   color: "text-blue-600" },
  price_offer:     { icon: TrendingUp,     bg: "bg-purple-50", color: "text-purple-600" },
  ai_optimized:    { icon: Bot,            bg: "bg-purple-50", color: "text-purple-700" },
  ai_negotiating:  { icon: Bot,            bg: "bg-violet-50", color: "text-violet-700" },
};

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Demo notifications shown when no DB data exists yet
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "demo-1",
    type: "ad_waiting",
    title: "Your Ad is Waiting to Go Live!",
    body: "An Operations Agent will review your listing — usually within 2 hours.",
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "demo-2",
    type: "ad_approved",
    title: "Approved by Operational Agent",
    body: "Your listing 'Honda City 2020' has been approved.",
    is_read: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "demo-3",
    type: "ad_live",
    title: "Live in Hyderabad",
    body: "Your listing is now live and visible to buyers in your area!",
    is_read: true,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "demo-4",
    type: "ai_optimized",
    title: "AI Agent optimised your listing",
    body: "Your title and description have been improved to reach 3× more buyers.",
    is_read: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "demo-5",
    type: "ai_negotiating",
    title: "AI Proxy is negotiating for you",
    body: "Your AI Broker Agent is handling a price negotiation with a buyer.",
    is_read: true,
    created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
  },
  {
    id: "demo-6",
    type: "new_message",
    title: "New message from Ravi Kumar",
    body: "Is the price negotiable? I can pick up tomorrow.",
    is_read: true,
    created_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
  },
];

interface NotificationsPanelProps {
  userId: string;
  compact?: boolean;
}

export default function NotificationsPanel({ userId, compact = false }: NotificationsPanelProps) {
  const { t } = useI18n();
  const supabase = createClient();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      setNotifs(data?.length ? data : DEMO_NOTIFICATIONS);
      setLoading(false);
    }
    load();

    // Realtime subscription for new notifications
    const channel = supabase
      .channel(`notifs:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => setNotifs((prev) => [payload.new as Notification, ...prev])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  async function markAllRead() {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markRead(id: string) {
    if (id.startsWith("demo-")) {
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      return;
    }
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  if (compact) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-600" />
            <h3 className="font-bold text-gray-900 text-sm">{t("notifications.title")}</h3>
            {unreadCount > 0 && (
              <span className="h-5 px-1.5 rounded-full text-white text-[10px] font-bold flex items-center"
                style={{ background: "#7C3AED" }}>
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-purple-600 font-medium flex items-center gap-1 hover:text-purple-800">
              <CheckCheck className="h-3.5 w-3.5" />
              {t("notifications.mark_read")}
            </button>
          )}
        </div>
        <NotifList notifs={notifs.slice(0, 5)} onRead={markRead} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">{t("notifications.title")}</h2>
          {unreadCount > 0 && (
            <span className="h-6 px-2 rounded-full text-white text-xs font-bold flex items-center"
              style={{ background: "#7C3AED" }}>
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-purple-600 font-medium flex items-center gap-1.5 hover:text-purple-800">
            <CheckCheck className="h-4 w-4" />
            {t("notifications.mark_read")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">{t("common.loading")}</div>
      ) : notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-10 w-10 text-gray-200 mb-3" />
          <p className="font-medium text-gray-500">{t("notifications.empty")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <NotifList notifs={notifs} onRead={markRead} />
        </div>
      )}
    </div>
  );
}

function NotifList({ notifs, onRead }: { notifs: Notification[]; onRead: (id: string) => void }) {
  return (
    <div className="divide-y divide-gray-50">
      {notifs.map((notif) => {
        const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.new_message;
        const Icon = cfg.icon;
        return (
          <button
            key={notif.id}
            onClick={() => onRead(notif.id)}
            className={`w-full flex items-start gap-3 px-4 py-4 text-left transition-colors ${
              notif.is_read ? "bg-white hover:bg-gray-50" : "bg-purple-50/40 hover:bg-purple-50"
            }`}
          >
            <div className={`h-9 w-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`h-4.5 w-4.5 ${cfg.color}`} style={{ width: 18, height: 18 }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${notif.is_read ? "font-medium text-gray-700" : "font-bold text-gray-900"}`}>
                {notif.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
              <p className="text-[11px] text-gray-400 mt-1">{relativeTime(notif.created_at)}</p>
            </div>
            {!notif.is_read && (
              <div className="h-2 w-2 rounded-full bg-purple-600 shrink-0 mt-1.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}
