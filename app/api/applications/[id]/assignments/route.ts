import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f-]{36}$/i;

/**
 * POST /api/applications/:id/assignments — HR assigns one or more
 * interviewers to a shortlisted application under a round label.
 * TRD §7, PRD §6.2.
 *
 * Body: { interviewer_ids: string[], round_label: string }
 * - Requires application.status = 'shortlisted' (PRD §6.2 "From a shortlisted candidate").
 * - Duplicate (application, interviewer, round) tuples are silently ignored
 *   via the unique constraint seeded in issue #2.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid application id." }, { status: 400 });
  }

  let body: { interviewer_ids?: unknown; round_label?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const interviewer_ids = Array.isArray(body.interviewer_ids)
    ? body.interviewer_ids.filter((s): s is string => typeof s === "string" && UUID_RE.test(s))
    : [];
  const round_label = typeof body.round_label === "string" ? body.round_label.trim() : "";

  if (interviewer_ids.length === 0) {
    return NextResponse.json({ error: "At least one interviewer is required." }, { status: 422 });
  }
  if (!round_label) {
    return NextResponse.json({ error: "Round label is required." }, { status: 422 });
  }
  if (round_label.length > 50) {
    return NextResponse.json({ error: "Round label is too long (max 50)." }, { status: 422 });
  }

  const supabase = createAdminClient();

  const { data: app, error: appErr } = await supabase
    .from("applications")
    .select("id, status")
    .eq("id", id)
    .single<{ id: string; status: string }>();
  if (appErr || !app) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
  if (app.status !== "shortlisted") {
    return NextResponse.json(
      { error: "Application must be shortlisted to assign interviewers." },
      { status: 422 },
    );
  }

  const rows = interviewer_ids.map((iid) => ({
    application_id: id,
    interviewer_id: iid,
    round_label,
  }));

  const { error: insertErr } = await supabase
    .from("interview_assignments")
    .upsert(rows, {
      onConflict: "application_id,interviewer_id,round_label",
      ignoreDuplicates: true,
    });

  if (insertErr) {
    console.error("Assignment insert failed:", insertErr);
    return NextResponse.json({ error: "Couldn't create assignments." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: rows.length }, { status: 201 });
}
