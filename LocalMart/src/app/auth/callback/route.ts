import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code       = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type") as "recovery" | "email" | "magiclink" | "signup" | null;
  const next       = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  async function roleRedirect(): Promise<NextResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: p } = await supabase
        .from("users").select("role").eq("id", user.id).single();
      if (p?.role === "ceo")      return NextResponse.redirect(`${origin}/dashboard`);
      if (p?.role === "agent")    return NextResponse.redirect(`${origin}/agent`);
      if (p?.role === "customer") return NextResponse.redirect(`${origin}/my-listings`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // ── PKCE / OAuth code exchange ───────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/update-password`);
      }
      return roleRedirect();
    }
  }

  // ── Token-hash exchange (email recovery / magic link) ────
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/update-password`);
      }
      return roleRedirect();
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
