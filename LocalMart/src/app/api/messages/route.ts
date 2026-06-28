import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  // Verify caller is a participant
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();
  if (!conv) return NextResponse.json({ error: "Not a participant" }, { status: 403 });

  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, is_ai, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark messages as read
  await supabase.from("messages").update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id);

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversation_id, content } = await req.json();
  if (!conversation_id || !content?.trim()) {
    return NextResponse.json({ error: "conversation_id and content required" }, { status: 400 });
  }

  // Verify caller is a participant
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, buyer_unread, seller_unread")
    .eq("id", conversation_id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();
  if (!conv) return NextResponse.json({ error: "Not a participant" }, { status: 403 });

  const { data: message, error } = await supabase
    .from("messages")
    .insert({ conversation_id, sender_id: user.id, content: content.trim(), is_ai: false })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const isBuyer = conv.buyer_id === user.id;
  await supabase.from("conversations").update({
    last_message: content.trim(),
    last_message_at: new Date().toISOString(),
    ...(isBuyer ? { seller_unread: conv.seller_unread + 1 } : { buyer_unread: conv.buyer_unread + 1 }),
  }).eq("id", conversation_id);

  return NextResponse.json(message);
}
