// POST /api/proposals/[id]/execution-webhook
//
// Internal webhook — called by the executor after the background task
// completes or fails. Transitions EXECUTING → EXECUTED or EXECUTION_FAILED.
//
// Protected by a shared secret (EXECUTION_WEBHOOK_SECRET env var).
// Not exposed to end-users.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transition } from "@/lib/approval/machine";
import { ProposalEvent, ProposalState } from "@/lib/approval/types";

const WEBHOOK_SECRET = process.env.EXECUTION_WEBHOOK_SECRET ?? "localmart-internal";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // ── Secret check ──────────────────────────────────────────
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${WEBHOOK_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals").select("*").eq("id", id).single();
  if (!proposal) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  if (proposal.state !== ProposalState.EXECUTING) {
    return NextResponse.json(
      { ok: false, error: `Expected state EXECUTING, got "${proposal.state}"` },
      { status: 409 },
    );
  }

  const body: {
    success:          boolean;
    result_data?:     Record<string, unknown> | null;
    execution_error?: string | null;
  } = await req.json();

  const event = body.success
    ? ProposalEvent.EXECUTION_COMPLETE
    : ProposalEvent.EXECUTION_FAILED;

  const txn = transition(ProposalState.EXECUTING, event);
  if (!txn.ok) return NextResponse.json({ ok: false, error: txn.error }, { status: 409 });

  await supabase.from("proposals").update({
    state:                  txn.newState,
    execution_result:       body.result_data ?? null,
    execution_error:        body.execution_error ?? null,
    execution_completed_at: new Date().toISOString(),
  }).eq("id", id);

  await supabase.from("proposal_audit_log").insert({
    proposal_id: id,
    event,
    from_state:  ProposalState.EXECUTING,
    to_state:    txn.newState,
    actor_role:  "system",
    notes:       body.execution_error ?? (body.success ? "Execution completed successfully" : "Execution failed"),
    metadata:    body.result_data ?? {},
  });

  // Notify CEO + submitter of outcome
  const { data: ceoUsers } = await supabase
    .from("users").select("id").eq("role", "ceo");
  const notifyUsers = [
    ...(ceoUsers ?? []).map(u => u.id),
    proposal.submitted_by_user_id,
  ];

  await supabase.from("notifications").insert(
    [...new Set(notifyUsers)].map(uid => ({
      user_id: uid,
      title:   body.success
        ? `Executed: ${proposal.title}`
        : `Execution Failed: ${proposal.title}`,
      body: body.success
        ? "The proposal was executed successfully."
        : `Execution failed: ${body.execution_error ?? "Unknown error"}`,
      link: `/ceo/approvals`,
      type: "proposal",
    }))
  );

  return NextResponse.json({ ok: true, new_state: txn.newState });
}
