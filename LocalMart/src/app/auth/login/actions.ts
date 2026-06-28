"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Role = "ceo" | "board" | "agent" | "customer" | "vendor";

function roleHome(role: Role | null | undefined): string {
  if (role === "ceo")   return "/ceo";
  if (role === "board") return "/board";
  if (role === "agent") return "/agent";
  return "/user";
}

export async function loginAction(
  formData: FormData,
): Promise<{ error: string } | never> {
  const email    = formData.get("email")    as string;
  const password = formData.get("password") as string;
  const next     = formData.get("next")     as string | null;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Wrong email or password. Please try again." };
  }

  // Role is in app_metadata — stamped at account creation, zero extra DB call
  const role = (data.user?.app_metadata?.role ?? data.user?.user_metadata?.role) as Role;
  const dest  = roleHome(role);

  // Honour ?next= only when it sits inside the user's own dashboard prefix
  const target = (next && next.startsWith(dest)) ? next : dest;

  // Server-side redirect: the SSR cookie is already set by createServerClient above,
  // so the middleware will see it on the very first request to the dashboard.
  redirect(target);
}
