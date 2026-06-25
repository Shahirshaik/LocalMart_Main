"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ShoppingBag, LayoutDashboard, ListChecks, Users, MapPin,
  ClipboardList, LogOut, Menu, X, Home, ChevronRight,
  Inbox, IndianRupee, ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

const CEO_LINKS = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/listings",  icon: ListChecks,      label: "Listings" },
  { href: "/dashboard/agents",    icon: Users,           label: "Agents" },
  { href: "/dashboard/villages",  icon: MapPin,          label: "Villages" },
  { href: "/dashboard/tasks",     icon: ClipboardList,   label: "Tasks" },
];

const AGENT_LINKS = [
  { href: "/agent",           icon: LayoutDashboard, label: "Overview" },
  { href: "/agent/listings",  icon: ListChecks,      label: "Listings" },
  { href: "/agent/requests",  icon: Inbox,           label: "Requests" },
  { href: "/agent/earnings",  icon: IndianRupee,     label: "Earnings" },
  { href: "/agent/services",  icon: ShieldCheck,     label: "Services" },
];

interface Props { role: UserRole; email: string; }

export function DashboardSidebar({ role, email }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const links = role === "ceo" ? CEO_LINKS : AGENT_LINKS;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const SidebarInner = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <ShoppingBag className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Local<span className="text-brand-600">Mart</span></p>
          <p className="text-[10px] text-gray-500 capitalize">{role} Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && href !== "/agent" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"
              )}>
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-3 py-4 space-y-0.5">
        <Link href="/" onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all">
          <Home className="h-4 w-4" /> View Site
        </Link>
        <button onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
        <div className="px-3 pt-3 pb-1">
          <p className="text-xs text-gray-400 truncate">{email}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg">
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl">
            <button onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
            <SidebarInner />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 shrink-0 flex-col bg-white border-r border-gray-100 h-screen sticky top-0">
        <SidebarInner />
      </div>
    </>
  );
}
