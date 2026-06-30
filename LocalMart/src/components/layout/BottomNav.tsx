"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, MessageCircle, ListChecks, User, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BRAND = "#7C3AED";
const MUTED  = "#757575";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });
  }, []);

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  function handleSell() {
    router.push(loggedIn ? "/listings/new" : "/auth/signup");
  }

  type TabDef = { href: string; icon: React.ElementType; label: string; exact?: boolean };

  const left: TabDef[] = [
    { href: "/",           icon: Home,          label: "Home",  exact: true },
    { href: "/user/inbox", icon: MessageCircle, label: "Chats" },
  ];
  const right: TabDef[] = [
    { href: "/my-listings", icon: ListChecks, label: "My Ads" },
    { href: "/user",        icon: User,       label: "Account" },
  ];

  function TabLink({ tab }: { tab: TabDef }) {
    const active = isActive(tab.href, tab.exact);
    const color  = active ? BRAND : MUTED;
    return (
      <Link
        href={tab.href}
        className="flex flex-col items-center justify-center flex-1 gap-0.5 py-1 min-h-[44px]"
      >
        <tab.icon style={{ color, width: 20, height: 20 }} strokeWidth={active ? 2.5 : 2} />
        <span className="text-[10px] font-medium" style={{ color }}>{tab.label}</span>
      </Link>
    );
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#e0e0e0]"
      style={{ height: 60, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center h-full">
        {left.map(t => <TabLink key={t.href} tab={t} />)}

        {/* Center Sell button */}
        <button
          onClick={handleSell}
          className="flex flex-col items-center justify-center shrink-0 -mt-6"
          style={{ width: 72 }}
        >
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 56, height: 56,
              background: "linear-gradient(135deg, #7C3AED, #4C1D95)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.5)",
            }}
          >
            <Plus style={{ color: "white", width: 28, height: 28 }} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-semibold mt-1" style={{ color: MUTED }}>SELL</span>
        </button>

        {right.map(t => <TabLink key={t.href} tab={t} />)}
      </div>
    </nav>
  );
}
