import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandling, fetchAgentBackend, requireRole } from "@/lib/api-handler";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const supabase = await createClient();
  const { user, errorResponse } = await requireRole(supabase, ["ceo", "board", "agent"]);
  if (errorResponse) return errorResponse;

  const { data: profile } = await supabase
    .from("users").select("role").eq("id", user!.id).single();
  const role = profile?.role ?? "agent";

  const body = await req.json();
  const { status, data } = await fetchAgentBackend("/agents/run/full", {
    ...body,
    triggered_by: `${role}_dashboard`,
  });

  return NextResponse.json(data, { status });
});
