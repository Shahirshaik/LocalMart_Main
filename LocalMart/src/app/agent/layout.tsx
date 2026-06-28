import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users").select("role,full_name").eq("id", user.id).single();

  if (!["agent", "ceo"].includes(profile?.role)) redirect("/user");

  return (
    <div className="dash-shell">
      <AppSidebar role="agent" userName={profile?.full_name || user.email || "Agent"} />
      <main className="dash-content">{children}</main>
    </div>
  );
}
