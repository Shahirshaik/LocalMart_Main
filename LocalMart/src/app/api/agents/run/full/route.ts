import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const AGENT_BACKEND = process.env.AGENT_BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  const role = profile?.role ?? "";
  if (!["ceo","board","agent"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  try {
    const res = await fetch(`${AGENT_BACKEND}/agents/run/full`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...body, triggered_by: `${role}_dashboard` }),
      signal:  AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { run_id: null, status: "backend_offline", message: "Agent backend is not reachable. Start it with: python main.py" },
      { status: 503 },
    );
  }
}
