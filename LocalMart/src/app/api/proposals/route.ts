// GET /api/proposals
//
// Returns proposals filtered by role:
//   CEO   → all proposals
//   Board → pending_board_review, revision_requested, pending_ceo_approval, executed, rejected
//   Agent → only their own proposals

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ProposalState } from "@/lib/approval/types";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users").select("role").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp    = req.nextUrl.searchParams;
  const state = sp.get("state")    ?? "";
  const type  = sp.get("type")     ?? "";
  const limit = Math.min(Number(sp.get("limit") ?? "50"), 100);

  let query = supabase
    .from("v_proposals_dashboard")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  // Row-level filter based on role
  if (profile.role === "agent") {
    query = query.eq("submitted_by_user_id" as "id", user.id);
  } else if (profile.role === "board") {
    const boardStates: ProposalState[] = [
      ProposalState.PENDING_BOARD_REVIEW,
      ProposalState.REVISION_REQUESTED,
      ProposalState.PENDING_CEO_APPROVAL,
      ProposalState.EXECUTED,
      ProposalState.REJECTED,
      ProposalState.EXECUTION_FAILED,
    ];
    query = query.in("state", boardStates);
  }
  // CEO gets all — no filter

  if (state) query = query.eq("state", state);
  if (type)  query = query.eq("proposal_type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ proposals: data ?? [], count: data?.length ?? 0 });
}
