"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import {
  ShoppingBag, Mail, Lock, Eye, EyeOff,
  ArrowRight, Phone, Smartphone, KeyRound, ChevronLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Tab = "password" | "email-otp" | "phone-otp";

function fmtPhone(p: string) {
  return p.startsWith("+") ? p : `+91${p.replace(/\D/g, "")}`;
}

async function redirectByRole(
  supabase: ReturnType<typeof createClient>,
  router: ReturnType<typeof useRouter>,
  fallback: string,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: p } = await supabase
      .from("users").select("role").eq("id", user.id).single();
    if (p?.role === "ceo")                        { router.push("/dashboard");  return; }
    if (p?.role === "agent")                      { router.push("/agent");       return; }
    if (p?.role === "customer" || p?.role === "vendor") { router.push("/my-listings"); return; }
  }
  router.push(fallback);
  router.refresh();
}

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get("next") || "/";
  const supabase     = createClient();

  const [tab, setTab]         = useState<Tab>("password");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [info, setInfo]       = useState("");

  // ── Password tab ─────────────────────────────────────────
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handlePassword = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError(""); setInfo("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    await redirectByRole(supabase, router, next);
  };

  // ── Email OTP tab ────────────────────────────────────────
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode]   = useState("");
  const [otpSent, setOtpSent]   = useState(false);

  const handleSendEmailOtp = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError(""); setInfo("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: otpEmail,
      options: { shouldCreateUser: false },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setOtpSent(true);
    setInfo(`A 6-digit code has been sent to ${otpEmail}`);
    setLoading(false);
  };

  const handleVerifyEmailOtp = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError(""); setInfo("");
    const { error: err } = await supabase.auth.verifyOtp({
      email: otpEmail, token: otpCode, type: "email",
    });
    if (err) { setError(err.message); setLoading(false); return; }
    await redirectByRole(supabase, router, next);
  };

  // ── Phone OTP tab ────────────────────────────────────────
  const [phone, setPhone]         = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneSent, setPhoneSent] = useState(false);

  const handleSendPhoneOtp = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError(""); setInfo("");
    const { error: err } = await supabase.auth.signInWithOtp({ phone: fmtPhone(phone) });
    if (err) {
      const msg = err.message.toLowerCase();
      setError(
        msg.includes("sms") || msg.includes("provider") || msg.includes("phone")
          ? "Phone OTP requires SMS setup in Supabase. Use Email OTP or Password instead."
          : err.message,
      );
      setLoading(false); return;
    }
    setPhoneSent(true);
    setInfo(`OTP sent to ${fmtPhone(phone)} via SMS`);
    setLoading(false);
  };

  const handleVerifyPhoneOtp = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError(""); setInfo("");
    const { error: err } = await supabase.auth.verifyOtp({
      phone: fmtPhone(phone), token: phoneCode, type: "sms",
    });
    if (err) { setError(err.message); setLoading(false); return; }
    await redirectByRole(supabase, router, next);
  };

  const switchTab = (t: Tab) => {
    setTab(t); setError(""); setInfo("");
    setOtpSent(false); setPhoneSent(false);
    setOtpCode(""); setPhoneCode("");
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "password",  label: "Password",  icon: <KeyRound   className="h-4 w-4" /> },
    { id: "email-otp", label: "Email OTP", icon: <Mail       className="h-4 w-4" /> },
    { id: "phone-otp", label: "Phone OTP", icon: <Smartphone className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen flex">

      {/* ── Left hero ── */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col justify-between px-16 py-12 text-white">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">LocalMart</span>
        </Link>

        <div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            Your village marketplace,<br />now in your pocket.
          </h2>
          <p className="text-purple-200 text-lg leading-relaxed max-w-sm mb-10">
            Buy, sell and connect — with a trusted local agent in every village.
          </p>
          {[
            { role: "CEO / Board",    desc: "Full dashboard — manage agents & analytics" },
            { role: "Agent",          desc: "Handle buyer requests, earn daily commissions" },
            { role: "Buyer / Vendor", desc: "Browse listings, contact agents instantly" },
          ].map(({ role, desc }) => (
            <div key={role} className="flex gap-3 mb-4">
              <div className="mt-1 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <ArrowRight className="h-3 w-3" />
              </div>
              <div>
                <p className="font-semibold text-sm">{role}</p>
                <p className="text-purple-200 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-purple-300 text-xs">© 2025 LocalMart. All rights reserved.</p>
      </div>

      {/* ── Right form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Local<span className="text-brand-600">Mart</span>
              </span>
            </Link>
          </div>

          <div className="card p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
            <p className="text-sm text-gray-500 mb-6">Choose how you want to log in</p>

            {/* Tab switcher */}
            <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 mb-6 gap-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => switchTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-all
                    ${tab === t.id
                      ? "bg-white shadow text-brand-700 ring-1 ring-brand-200"
                      : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Banners */}
            {error && (
              <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {info && !error && (
              <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                {info}
              </div>
            )}

            {/* ════════ PASSWORD ════════ */}
            {tab === "password" && (
              <form onSubmit={handlePassword} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@gmail.com" className="input pl-10"
                    />
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
                    <input
                      type={showPass ? "text" : "password"} required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password" className="input pl-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                  {loading ? "Signing in…" : "Sign In"}
                </button>
              </form>
            )}

            {/* ════════ EMAIL OTP — step 1 ════════ */}
            {tab === "email-otp" && !otpSent && (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email" required value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="you@gmail.com" className="input pl-10"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  We'll send a one-time code to your inbox. No password needed.
                </p>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? "Sending…" : "Send OTP →"}
                </button>
              </form>
            )}

            {/* ════════ EMAIL OTP — step 2 ════════ */}
            {tab === "email-otp" && otpSent && (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 mb-3">
                    <Mail className="h-7 w-7 text-brand-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Check your inbox</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Code sent to <span className="font-medium">{otpEmail}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    6-digit code
                  </label>
                  <input
                    type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                    required value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="input text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus
                  />
                </div>
                <button
                  type="submit" disabled={loading || otpCode.length < 6}
                  className="btn-primary w-full py-3">
                  {loading ? "Verifying…" : "Verify & Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpCode(""); setInfo(""); }}
                  className="w-full text-xs text-center text-gray-500 hover:text-brand-600 flex items-center justify-center gap-1">
                  <ChevronLeft className="h-3 w-3" /> Change email
                </button>
              </form>
            )}

            {/* ════════ PHONE OTP — step 1 ════════ */}
            {tab === "phone-otp" && !phoneSent && (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Mobile number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 shrink-0">
                      <Phone className="h-4 w-4 text-gray-400" /> +91
                    </div>
                    <input
                      type="tel" required value={phone} maxLength={10}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210" className="input flex-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  A 6-digit code will be sent to your mobile via SMS.
                </p>
                <button
                  type="submit" disabled={loading || phone.length < 10}
                  className="btn-primary w-full py-3">
                  {loading ? "Sending…" : "Send OTP →"}
                </button>
              </form>
            )}

            {/* ════════ PHONE OTP — step 2 ════════ */}
            {tab === "phone-otp" && phoneSent && (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 mb-3">
                    <Smartphone className="h-7 w-7 text-brand-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">Check your SMS</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Code sent to <span className="font-medium">{fmtPhone(phone)}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    6-digit code
                  </label>
                  <input
                    type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                    required value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="input text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus
                  />
                </div>
                <button
                  type="submit" disabled={loading || phoneCode.length < 6}
                  className="btn-primary w-full py-3">
                  {loading ? "Verifying…" : "Verify & Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => { setPhoneSent(false); setPhoneCode(""); setInfo(""); }}
                  className="w-full text-xs text-center text-gray-500 hover:text-brand-600 flex items-center justify-center gap-1">
                  <ChevronLeft className="h-3 w-3" /> Change number
                </button>
              </form>
            )}

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
