"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  listingId: string;
  sellerId: string;
  sellerName?: string | null;
}

export function ChatWithSellerButton({ listingId, sellerId, sellerName }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleChat() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/auth/login?next=/listings/${listingId}`);
        return;
      }

      // Don't open a chat with yourself
      if (user.id === sellerId) {
        router.push("/my-listings");
        return;
      }

      // Check if a conversation already exists for this listing between these two users
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listingId)
        .eq("buyer_id", user.id)
        .eq("seller_id", sellerId)
        .maybeSingle();

      if (existing) {
        router.push(`/user/inbox?conv=${existing.id}`);
        return;
      }

      // Create a new conversation thread
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({
          listing_id:      listingId,
          buyer_id:        user.id,
          seller_id:       sellerId,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error || !created) {
        console.error("Chat creation failed:", error?.message);
        alert("Could not open chat. Please try again.");
        return;
      }

      router.push(`/user/inbox?conv=${created.id}`);
    } finally {
      setLoading(false);
    }
  }

  const firstName = sellerName?.split(" ")[0] ?? "Seller";

  return (
    <button
      onClick={handleChat}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:opacity-60 active:scale-95"
      style={{ background: "linear-gradient(135deg,#3B0764,#7C3AED)" }}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <MessageCircle className="h-4 w-4" />
          Chat with {firstName}
        </>
      )}
    </button>
  );
}
