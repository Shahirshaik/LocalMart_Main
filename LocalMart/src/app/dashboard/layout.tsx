import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "ceo") redirect("/");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="ceo" email={user.email ?? ""} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
