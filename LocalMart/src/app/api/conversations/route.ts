import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("conversations")
    .select("id, listing_id, buyer_id, seller_id, last_message, last_message_at, ai_proxy_active, buyer_unread, seller_unread, created_at")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listing_id, seller_id } = await req.json();
  if (!seller_id) return NextResponse.json({ error: "seller_id required" }, { status: 400 });
  if (seller_id === user.id) return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });

  // Upsert: return existing conversation if already exists
  const { data, error } = await supabase
    .from("conversations")
    .upsert(
      { listing_id: listing_id ?? null, buyer_id: user.id, seller_id },
      { onConflict: "listing_id,buyer_id,seller_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
