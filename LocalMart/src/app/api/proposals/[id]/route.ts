// GET /api/proposals/[id]
// Returns full proposal detail + audit log + individual votes.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allowedEvents } from "@/lib/approval/machine";
import { ProposalState } from "@/lib/approval/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users").select("role").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [{ data: proposal }, { data: auditLog }, { data: votes }] = await Promise.all([
    supabase.from("proposals").select("*, users!submitted_by_user_id(full_name, phone), ai_agents(name)").eq("id", id).single(),
    supabase.from("proposal_audit_log").select("*").eq("proposal_id", id).order("occurred_at", { ascending: true }),
    supabase.from("proposal_votes").select("*, users(full_name, role)").eq("proposal_id", id),
  ]);

  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Access control: agents can only see their own proposals
  if (profile.role === "agent" && proposal.submitted_by_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const nextEvents = allowedEvents(proposal.state as ProposalState);

  return NextResponse.json({
    proposal,
    audit_log:    auditLog ?? [],
    votes:        votes    ?? [],
    next_events:  nextEvents,
  });
}
