import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandling, fetchAgentBackend, requireUser } from "@/lib/api-handler";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const supabase = await createClient();
  const { errorResponse } = await requireUser(supabase);
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const { status, data } = await fetchAgentBackend("/agents/run/marketing", body);
  return NextResponse.json(data, { status });
});
