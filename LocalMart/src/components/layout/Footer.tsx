import Link from "next/link";
import { ShoppingBag, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">
                Local<span className="text-brand-400">Mart</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              India&apos;s village-first hyper-local marketplace. Buy, sell and find services right in your neighborhood.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Marketplace</h3>
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
                    className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Account</h3>
            <ul className="space-y-2">
              {[
                { href: "/auth/login",  label: "Sign In" },
                { href: "/auth/signup", label: "Create Account" },
                { href: "/dashboard",   label: "CEO Dashboard" },
                { href: "/agent",       label: "Agent Portal" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 shrink-0 mt-0.5 text-brand-400" />
                <a href="mailto:hello@localmart.in"
                  className="text-sm text-gray-400 hover:text-white transition-colors">
                  hello@localmart.in
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 shrink-0 mt-0.5 text-brand-400" />
                <a href="tel:+919876543210"
                  className="text-sm text-gray-400 hover:text-white transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-brand-400" />
                <span className="text-sm text-gray-400">India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} LocalMart. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="/terms"   className="hover:text-gray-300 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
