import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { WebSocketProvider } from "@/components/dashboard/WebSocketProvider";
import AgentAlertBanner from "@/components/dashboard/AgentAlertBanner";

export default async function BoardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users").select("role,full_name").eq("id", user.id).single();

  if (!["board", "ceo"].includes(profile?.role)) redirect("/auth/login");

  return (
    <WebSocketProvider>
      <div className="dash-shell">
        <AppSidebar role="board" userName={profile?.full_name || user.email || "Board"} />
        <main className="dash-content">
          <AgentAlertBanner />
          {children}
        </main>
      </div>
    </WebSocketProvider>
  );
}
