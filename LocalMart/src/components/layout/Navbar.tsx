"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingBag, Menu, X, Plus, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";
import type { UserRole } from "@/types/database";

interface Props {
  userRole?: UserRole | null;
  userEmail?: string | null;
}

const NAV_LINKS = [
  { href: "/listings",               key: "nav.browse"   },
  { href: "/listings?type=sell",     key: "nav.buy"      },
  { href: "/listings?type=service",  key: "nav.services" },
];


export function Navbar({ userRole, userEmail }: Props) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const dashboardHref =
    userRole === "ceo"   ? "/dashboard" :
    userRole === "agent" ? "/agent"     :
    userRole === "customer" ? "/my-listings" : null;

  return (
    <header className="site-navbar">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg logo-icon-bg">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-white hidden sm:block">
              Local<span className="text-gold">Mart</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                className={`nav-link ${pathname === link.href ? "active" : ""}`}>
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link href="/listings/new" className="btn-post-ad hidden sm:inline-flex text-xs py-2 px-3">
              <Plus className="h-3.5 w-3.5" /> {t("nav.post_free_ad")}
            </Link>

            {userEmail ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-purple-100 hover:bg-white/20 transition-colors">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block max-w-[100px] truncate">{userEmail.split("@")[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-gray-100 shadow-xl py-1.5 z-20">
                      {dashboardHref && (
                        <Link href={dashboardHref} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                          <LayoutDashboard className="h-4 w-4" />
                          {userRole === "ceo" ? "CEO Dashboard" : userRole === "agent" ? "Agent Dashboard" : "My Listings"}
                        </Link>
                      )}
                      <Link href="/listings/new" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                        <Plus className="h-4 w-4" /> {t("nav.sell")}
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="h-4 w-4" /> {t("nav.logout")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="text-sm font-medium text-purple-200 hover:text-white transition-colors px-3 py-2">
                  {t("nav.login") || "Sign In"}
                </Link>
                <Link href="/auth/signup" className="btn-post-ad text-sm">
                  {t("nav.signup") || "Sign Up"}
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden rounded-lg p-2 text-purple-200 hover:bg-white/10 transition-colors">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-purple-800/40 space-y-0.5">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-purple-200 hover:bg-white/10 hover:text-white transition-colors">
                {t(link.key)}
              </Link>
            ))}
            <Link href="/listings/new" onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-bold text-gold hover:bg-white/10 transition-colors">
              + {t("nav.post_free_ad")}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
