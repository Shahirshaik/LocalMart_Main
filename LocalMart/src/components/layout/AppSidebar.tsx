"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, LogOut, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

type NavItem = { href: string; label: string; icon: string };

const CEO_NAV: NavItem[] = [
  { href: "/ceo",                icon: "🏠", label: "Overview" },
  { href: "/ceo/approvals",      icon: "✅", label: "Approvals" },
  { href: "/ceo/agents",         icon: "👥", label: "Agents" },
  { href: "/ceo/listings",       icon: "📋", label: "All Listings" },
  { href: "/ceo/ai-agents",      icon: "🤖", label: "AI Agents" },
  { href: "/ceo/analytics",      icon: "📊", label: "Analytics" },
  { href: "/ceo/locations",      icon: "📍", label: "Locations" },
];

const BOARD_NAV: NavItem[] = [
  { href: "/board",              icon: "🏠", label: "Overview" },
  { href: "/board/approvals",    icon: "✅", label: "Approvals" },
  { href: "/board/agents",       icon: "👥", label: "Agents" },
  { href: "/board/analytics",    icon: "📊", label: "Analytics" },
];

const AGENT_NAV: NavItem[] = [
  { href: "/agent",              icon: "🏠", label: "Dashboard" },
  { href: "/agent/listings",     icon: "📋", label: "My Listings" },
  { href: "/agent/requests",     icon: "📩", label: "Requests" },
  { href: "/agent/tasks",        icon: "✅", label: "Tasks" },
  { href: "/agent/services",     icon: "⚙️", label: "Services" },
  { href: "/agent/earnings",     icon: "💰", label: "Earnings" },
  { href: "/agent/ai-assist",    icon: "🤖", label: "AI Assist" },
];

const USER_NAV: NavItem[] = [
  { href: "/user",               icon: "🏠", label: "My Home" },
  { href: "/user/browse",        icon: "🔍", label: "Browse" },
  { href: "/user/listings",      icon: "📋", label: "My Listings" },
  { href: "/user/saved",         icon: "❤️", label: "Saved" },
  { href: "/user/profile",       icon: "👤", label: "Profile" },
];

type Role = "ceo" | "board" | "agent" | "customer" | "vendor";

function navFor(role: Role): NavItem[] {
  if (role === "ceo")   return CEO_NAV;
  if (role === "board") return BOARD_NAV;
  if (role === "agent") return AGENT_NAV;
  return USER_NAV;
}

const ROLE_LABEL: Record<string, string> = {
  ceo: "CEO Dashboard",
  board: "Board Member",
  agent: "Operations Agent",
  customer: "Marketplace",
  vendor: "Marketplace",
};

const ROLE_BADGE_COLOR: Record<string, string> = {
  ceo:      "bg-yellow-500",
  board:    "bg-purple-500",
  agent:    "bg-blue-500",
  customer: "bg-green-500",
  vendor:   "bg-green-500",
};

export function AppSidebar({ role, userName, onClose }: { role: Role; userName?: string; onClose?: () => void }) {
  const { t }    = useI18n();
  const pathname = usePathname();
  const router   = useRouter();
  const nav      = navFor(role);

  const handleLogout = async () => {
    onClose?.();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <aside className="h-full flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-purple-900/40 mt-10 md:mt-0">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{background:"rgba(255,255,255,0.15)"}}>
          <ShoppingBag className="text-white" style={{width:16,height:16}} />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">LocalMart</div>
          <div className="text-purple-400 text-xs">Made in India 🇮🇳</div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-purple-900/30">
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 rounded-full ${ROLE_BADGE_COLOR[role]} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
            {(userName || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-semibold truncate">{userName || "User"}</div>
            <div className="text-purple-400 text-xs">{ROLE_LABEL[role]}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {nav.map(item => {
          const active = pathname === item.href || (item.href !== "/" + role.split("/")[0] && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              onClick={() => onClose?.()}
              className={`dash-sidebar-link ${active ? "active" : ""}`}>
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              <span className="flex-1 text-sm">{item.label}</span>
              {active && <ChevronRight className="h-3 w-3 text-purple-400 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-purple-900/30">
        <Link href="/" onClick={() => onClose?.()} className="dash-sidebar-link mb-1">
          <span className="text-base w-5 text-center">🌐</span>
          <span className="text-sm">{t("common.browse") || "View Marketplace"}</span>
        </Link>
        <button onClick={handleLogout} className="dash-sidebar-link w-full text-left">
          <LogOut className="h-4 w-4 text-purple-400 shrink-0" />
          <span className="text-sm">{t("nav.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
