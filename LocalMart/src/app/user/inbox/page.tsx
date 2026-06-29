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
    <div className="p-3 md:p-6 h-[calc(100dvh-56px)] md:h-[calc(100dvh-0px)] flex flex-col">
      <div className="mb-3 md:mb-4">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">Messages</h1>
        <p className="text-xs text-gray-500 mt-0.5">Chat directly with buyers &amp; sellers — free, peer-to-peer</p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatInbox
          currentUserId={user.id}
          initialConversationId={conv ?? null}
        />
      </div>
    </div>
  );
}
