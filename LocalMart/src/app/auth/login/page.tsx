"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ShoppingBag, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { loginAction } from "./actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    fd.set("next", next);
    const result = await loginAction(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success the server action redirects — no client-side nav needed
  };

  return (
    <div className="min-h-screen flex">
      {/* Left hero */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col justify-between px-16 py-12 text-white">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <ShoppingBag className="text-white" style={{width:18,height:18}} />
          </div>
          <span className="text-xl font-bold">LocalMart</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{background:"rgba(245,158,11,0.3)",color:"#FDE68A"}}>🇮🇳 Made in India</span>
        </Link>

        <div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            India's Hyper-Local<br />Super-App
          </h2>
          <p className="text-purple-200 text-lg leading-relaxed mb-10 max-w-sm">
            Vegetables to Real Estate. Gas to Construction. Every village, every vertical.
          </p>
          <div className="space-y-4">
            {[
              { role: "CEO / Board",    icon: "👑", desc: "Full analytics, approvals & AI agent oversight" },
              { role: "Operations Agent", icon: "⚙️", desc: "Manage listings, tasks & earn commissions" },
              { role: "Buyer / Seller",  icon: "🏡", desc: "Browse, post listings, contact agents instantly" },
            ].map(({ role, icon, desc }) => (
              <div key={role} className="flex gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-base shrink-0">{icon}</div>
                <div>
                  <p className="font-semibold text-sm">{role}</p>
                  <p className="text-purple-300 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-purple-400 text-xs">© 2025 LocalMart. All rights reserved.</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{background:"linear-gradient(135deg,#4C1D95,#7C3AED)"}}>
                <ShoppingBag className="text-white" style={{width:16,height:16}} />
              </div>
              <span className="text-xl font-bold">Local<span style={{color:"#7C3AED"}}>Mart</span></span>
            </Link>
          </div>

          <div className="card p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
            <p className="text-sm text-gray-500 mb-6">Enter your email and password to continue</p>

            {error && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input name="email" type="email" required autoComplete="email"
                    placeholder="you@gmail.com" className="input pl-10" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:text-brand-700">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input name="password" type={showPass ? "text" : "password"} required autoComplete="current-password"
                    placeholder="Your password" className="input pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-royal w-full py-3 mt-2">
                {loading ? "Signing in…" : (<>Sign In <ArrowRight className="h-4 w-4" /></>)}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              No account?{" "}
              <Link href="/auth/signup" className="font-semibold text-brand-600 hover:text-brand-700">
                Sign up free
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            <Link href="/" className="hover:text-gray-600">← Back to LocalMart</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
