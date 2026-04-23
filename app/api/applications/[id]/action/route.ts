import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED = new Set(["shortlist", "rejected", "saved"] as const);
type Action = "shortlist" | "rejected" | "saved";

/**
 * POST /api/applications/:id/action — transition an Application's status.
 * TRD §7: body is `{ action: "shortlist" | "reject" | "save_for_later" }`.
 *
 * MVP: no guard on current status; every action is HR-initiated (PRD §6.1
 * "Manual HR control — AI ranks and explains; HR confirms every shortlist
 * and reject. No auto-advance, no auto-reject.")
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid application id." }, { status: 400 });
  }

  let body: { action?: string };
  try {
    body = (await req.json()) as { action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = body.action;
  const action = raw === "shortlist" || raw === "rejected" || raw === "saved" ? (raw as Action) : null;
  if (!action || !ALLOWED.has(action)) {
    return NextResponse.json(
      { error: `action must be one of: shortlist, rejected, saved` },
      { status: 422 },
    );
  }

  const status = action === "shortlist" ? "shortlisted" : action;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: `Couldn't update application: ${error?.message ?? "not found"}` },
      { status: error ? 500 : 404 },
    );
  }

  return NextResponse.json({ ok: true, status: data.status });
}
