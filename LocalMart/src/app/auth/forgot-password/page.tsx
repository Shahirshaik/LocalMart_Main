"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Local<span className="text-brand-600">Mart</span>
            </span>
          </Link>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-1">
                We sent a password reset link to
              </p>
              <p className="text-sm font-semibold text-gray-800 mb-6">{email}</p>
              <p className="text-xs text-gray-400 mb-6">
                Click the link in the email → set your new password → login immediately.
                <br />If you don't see it, check your spam folder.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset password</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send you a link to set a new password.
              </p>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      className="input pl-10"
                      autoFocus
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link href="/auth/login"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
