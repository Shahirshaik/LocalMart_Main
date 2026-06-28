import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type Role = "ceo" | "board" | "agent" | "customer" | "vendor";

function roleHome(role: Role | null | undefined): string {
  if (role === "ceo")   return "/ceo";
  if (role === "board") return "/board";
  if (role === "agent") return "/agent";
  return "/user";
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as never)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Read role from JWT app_metadata — no DB round-trip, no RLS issues
  const role = (user?.app_metadata?.role ?? null) as Role | null;

  // ── Protect /ceo ── CEO only
  if (path.startsWith("/ceo")) {
    if (!role) return NextResponse.redirect(new URL("/auth/login?next=/ceo", request.url));
    if (role !== "ceo") return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  // ── Protect /board ── Board + CEO only
  if (path.startsWith("/board")) {
    if (!role) return NextResponse.redirect(new URL("/auth/login?next=/board", request.url));
    if (!["board", "ceo"].includes(role)) return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  // ── Protect /agent ── Agent + CEO
  if (path.startsWith("/agent")) {
    if (!role) return NextResponse.redirect(new URL("/auth/login?next=/agent", request.url));
    if (!["agent", "ceo"].includes(role)) return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  // ── Protect /user ── Authenticated
  if (path.startsWith("/user")) {
    if (!user) return NextResponse.redirect(new URL("/auth/login?next=/user", request.url));
  }

  // ── Protect /dashboard (legacy) → redirect to role home
  if (path.startsWith("/dashboard")) {
    if (!role) return NextResponse.redirect(new URL("/auth/login", request.url));
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  // ── Protect /my-listings (legacy) → redirect to /user
  if (path.startsWith("/my-listings")) {
    if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));
    return NextResponse.redirect(new URL("/user", request.url));
  }

  // ── Redirect authenticated users away from auth pages
  if (path.startsWith("/auth/") && user) {
    return NextResponse.redirect(new URL(roleHome(role), request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)",
  ],
};
