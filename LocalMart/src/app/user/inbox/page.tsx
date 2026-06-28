import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatInbox from "@/components/user/ChatInbox";

interface InboxPageProps {
  searchParams: Promise<{ conv?: string }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/user/inbox");

  const { conv } = await searchParams;

  return (
    <div>
      <div className="dash-topbar">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          <p className="text-xs text-gray-500 mt-0.5">Chat with buyers and sellers</p>
        </div>
      </div>

      <div className="p-6" style={{ height: "calc(100vh - 73px)" }}>
        <ChatInbox
          currentUserId={user.id}
          initialConversationId={conv ?? null}
        />
      </div>
    </div>
  );
}
