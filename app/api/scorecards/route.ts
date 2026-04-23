import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f-]{36}$/i;
const RECOMMENDATIONS = new Set([
  "strong_hire",
  "hire",
  "no_hire",
  "strong_no_hire",
] as const);

/**
 * POST /api/scorecards — interviewer submits a structured scorecard.
 * TRD §7. Validates:
 *  - assignment exists
 *  - scorecard doesn't already exist for this assignment (unique on assignment_id)
 *  - every focus attribute has a 1–4 BARS rating
 *  - recommendation is one of 4 allowed values (no neutral option per PRD §6.2)
 */
export async function POST(req: Request) {
  let body: {
    assignment_id?: unknown;
    ratings?: unknown;
    notes?: unknown;
    recommendation?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const assignment_id = typeof body.assignment_id === "string" ? body.assignment_id : "";
  if (!UUID_RE.test(assignment_id)) {
    return NextResponse.json({ error: "Invalid assignment_id." }, { status: 400 });
  }

  const recommendation = typeof body.recommendation === "string" ? body.recommendation : "";
  if (!RECOMMENDATIONS.has(recommendation as "strong_hire" | "hire" | "no_hire" | "strong_no_hire")) {
    return NextResponse.json(
      { error: "recommendation must be strong_hire | hire | no_hire | strong_no_hire." },
      { status: 422 },
    );
  }

  const ratings = toRatingsMap(body.ratings);
  if (!ratings) {
    return NextResponse.json(
      { error: "ratings must be an object of { [focus_attribute]: 1–4 }." },
      { status: 422 },
    );
  }

  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  const supabase = createAdminClient();

  const { data: assignment, error: aErr } = await supabase
    .from("interview_assignments")
    .select("id, application_id")
    .eq("id", assignment_id)
    .single<{ id: string; application_id: string }>();
  if (aErr || !assignment) {
    return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("scorecards")
    .select("id")
    .eq("assignment_id", assignment_id)
    .maybeSingle<{ id: string }>();
  if (existing) {
    return NextResponse.json({ error: "Scorecard already submitted." }, { status: 409 });
  }

  const { data: app } = await supabase
    .from("applications")
    .select("req_id")
    .eq("id", assignment.application_id)
    .single<{ req_id: string }>();
  if (!app) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const { data: reqRow } = await supabase
    .from("reqs")
    .select("focus_attributes")
    .eq("id", app.req_id)
    .single<{ focus_attributes: string[] | null }>();
  const focus = reqRow?.focus_attributes ?? [];

  for (const attr of focus) {
    const v = ratings[attr];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 4) {
      return NextResponse.json(
        { error: `Rating for "${attr}" is required (1–4).` },
        { status: 422 },
      );
    }
  }

  const { error: insertErr } = await supabase.from("scorecards").insert({
    assignment_id,
    ratings,
    notes,
    recommendation,
  });
  if (insertErr) {
    console.error("Scorecard insert failed:", insertErr);
    return NextResponse.json({ error: "Couldn't save scorecard." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

function toRatingsMap(v: unknown): Record<string, number> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof k !== "string" || !k.trim()) return null;
    if (typeof val !== "number" || !Number.isInteger(val) || val < 1 || val > 4) return null;
    out[k] = val;
  }
  return out;
}
