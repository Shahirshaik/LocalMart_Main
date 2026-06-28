import Link from "next/link";
import { ShoppingBag, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer style={{ background: "#1e1b4b", color: "#9ca3af" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "linear-gradient(135deg, #4C1D95, #7C3AED)" }}>
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">
                Local<span style={{ color: "#A78BFA" }}>Mart</span>
                <span className="ml-2 text-xs font-bold" style={{ color: "#F59E0B" }}>🇮🇳</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "#9ca3af" }}>
              India&apos;s village-first hyper-local marketplace. Buy, sell and find services right in your neighborhood.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-white">Marketplace</h3>
            <ul className="space-y-2">
              {[
                { href: "/listings",              label: "Browse All" },
                { href: "/listings?type=sell",    label: "Buy Items" },
                { href: "/listings?type=service", label: "Services" },
                { href: "/listings?type=rent",    label: "Rentals" },
                { href: "/listings/new",          label: "Post Free Listing" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "#9ca3af" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-white">Account</h3>
            <ul className="space-y-2">
              {[
                { href: "/auth/login",  label: "Sign In" },
                { href: "/auth/signup", label: "Create Account" },
                { href: "/dashboard",   label: "CEO Dashboard" },
                { href: "/agent",       label: "Agent Portal" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "#9ca3af" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-white">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#A78BFA" }} />
                <a href="mailto:hello@localmart.in"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: "#9ca3af" }}>
                  hello@localmart.in
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#A78BFA" }} />
                <a href="tel:+919876543210"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: "#9ca3af" }}>
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#A78BFA" }} />
                <span className="text-sm" style={{ color: "#9ca3af" }}>India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "#6b7280" }}>
            &copy; {new Date().getFullYear()} LocalMart Technologies Pvt. Ltd. · All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#6b7280" }}>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms"   className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
