import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users").select("role,full_name").eq("id", user.id).single();

  return (
    <div className="dash-shell">
      <AppSidebar role={(profile?.role as "customer" | "vendor") ?? "customer"} userName={profile?.full_name || user.email || "User"} />
      <main className="dash-content">{children}</main>
    </div>
  );
}
