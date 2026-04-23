import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface AppRow {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: "new" | "shortlisted" | "saved" | "rejected";
  submitted_at: string;
  resume_storage_path: string;
  req_id: string;
}

interface ScoreRow {
  match_score: number;
  must_have_checks: Array<{ requirement: string; met: boolean; evidence: string }>;
  nice_to_have_checks: Array<{ requirement: string; met: boolean; evidence: string }>;
  strengths: string[];
  gaps: string[];
  summary: string;
  scored_at: string;
}

interface ReqRow {
  title: string;
  role_family: string;
}

interface AssignmentRow {
  id: string;
  interviewer_id: string;
  round_label: string;
  created_at: string;
}

interface InterviewerRow {
  id: string;
  name: string;
  email: string;
}

/**
 * GET /api/applications/:id — full detail for the HR side panel.
 * TRD §7: "side panel payload (score + signed resume URL)".
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid application id." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: app, error: appErr } = await supabase
    .from("applications")
    .select("id, candidate_name, candidate_email, status, submitted_at, resume_storage_path, req_id")
    .eq("id", id)
    .single<AppRow>();
  if (appErr || !app) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const { data: score } = await supabase
    .from("scores")
    .select("match_score, must_have_checks, nice_to_have_checks, strengths, gaps, summary, scored_at")
    .eq("application_id", id)
    .maybeSingle<ScoreRow>();

  const { data: req } = await supabase
    .from("reqs")
    .select("title, role_family")
    .eq("id", app.req_id)
    .single<ReqRow>();

  // Signed URL, 10-minute TTL (TRD §10.5 of the original spec, and the storage
  // bucket is private — `resumes` was seeded as public:false in issue #2).
  const { data: signed, error: signErr } = await supabase.storage
    .from("resumes")
    .createSignedUrl(app.resume_storage_path, 600);

  // Assignments with denormalised interviewer for the side panel (issue #7).
  const { data: assignmentRows } = await supabase
    .from("interview_assignments")
    .select("id, interviewer_id, round_label, created_at")
    .eq("application_id", id)
    .order("created_at", { ascending: true })
    .returns<AssignmentRow[]>();

  const interviewerIds = (assignmentRows ?? []).map((a) => a.interviewer_id);
  const { data: interviewerRows } = interviewerIds.length
    ? await supabase
        .from("interviewers")
        .select("id, name, email")
        .in("id", interviewerIds)
        .returns<InterviewerRow[]>()
    : { data: [] as InterviewerRow[] };
  const interviewersById = new Map((interviewerRows ?? []).map((i) => [i.id, i]));
  const assignments = (assignmentRows ?? []).map((a) => ({
    id: a.id,
    round_label: a.round_label,
    created_at: a.created_at,
    interviewer: interviewersById.get(a.interviewer_id) ?? null,
  }));

  return NextResponse.json({
    id: app.id,
    candidate_name: app.candidate_name,
    candidate_email: app.candidate_email,
    status: app.status,
    submitted_at: app.submitted_at,
    resume_storage_path: app.resume_storage_path,
    resume_signed_url: signed?.signedUrl ?? null,
    resume_error: signErr?.message ?? null,
    score: score ?? null,
    req: req ?? null,
    assignments,
  });
}
