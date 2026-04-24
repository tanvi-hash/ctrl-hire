import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStage, type DbStatus, type PipelineStage } from "@/lib/stage";
import { Shortlist, type RankedApplication, type ReqView } from "./shortlist";

interface ReqRow {
  id: string;
  slug: string;
  title: string;
  role_family: string;
  must_haves: string[] | null;
  nice_to_haves: string[] | null;
  focus_attributes: string[] | null;
}

interface AppRow {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: DbStatus;
  submitted_at: string;
  source: string | null;
}

interface ScoreRow {
  application_id: string;
  match_score: number;
  strengths: string[] | null;
  gaps: string[] | null;
  summary: string;
  profile: {
    current_company?: string | null;
    current_title?: string | null;
    location?: string | null;
    years_of_experience?: number | null;
    phone?: string | null;
  } | null;
}

interface AssignmentLite {
  id: string;
  application_id: string;
}

interface ScorecardLite {
  assignment_id: string;
}

export default async function HRReqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: req, error: reqErr } = await supabase
    .from("reqs")
    .select("id, slug, title, role_family, must_haves, nice_to_haves, focus_attributes")
    .eq("id", id)
    .single<ReqRow>();
  if (reqErr || !req) notFound();

  const { data: apps, error: appsErr } = await supabase
    .from("applications")
    .select("id, candidate_name, candidate_email, status, submitted_at, source")
    .eq("req_id", id)
    .returns<AppRow[]>();

  const appIds = (apps ?? []).map((a) => a.id);

  const { data: scores } = appIds.length
    ? await supabase
        .from("scores")
        .select("application_id, match_score, strengths, gaps, summary, profile")
        .in("application_id", appIds)
        .returns<ScoreRow[]>()
    : { data: [] as ScoreRow[] };

  // Assignments + scorecards drive the derived "interviewing" stage (lib/stage.ts).
  const { data: assignments } = appIds.length
    ? await supabase
        .from("interview_assignments")
        .select("id, application_id")
        .in("application_id", appIds)
        .returns<AssignmentLite[]>()
    : { data: [] as AssignmentLite[] };

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: scorecards } = assignmentIds.length
    ? await supabase
        .from("scorecards")
        .select("assignment_id")
        .in("assignment_id", assignmentIds)
        .returns<ScorecardLite[]>()
    : { data: [] as ScorecardLite[] };

  const submittedAssignmentIds = new Set((scorecards ?? []).map((s) => s.assignment_id));
  // per-application submitted-scorecard count
  const scorecardCountByApp = new Map<string, number>();
  for (const a of assignments ?? []) {
    if (submittedAssignmentIds.has(a.id)) {
      scorecardCountByApp.set(a.application_id, (scorecardCountByApp.get(a.application_id) ?? 0) + 1);
    }
  }

  const scoreByApp = new Map((scores ?? []).map((s) => [s.application_id, s]));

  const ranked: RankedApplication[] = (apps ?? [])
    .map((a) => {
      const s = scoreByApp.get(a.id);
      const stage: PipelineStage = computeStage(a.status, scorecardCountByApp.get(a.id) ?? 0);
      return {
        id: a.id,
        candidate_name: a.candidate_name,
        candidate_email: a.candidate_email,
        status: a.status,
        stage,
        submitted_at: a.submitted_at,
        source: a.source,
        score: s
          ? {
              match_score: s.match_score,
              strengths: s.strengths ?? [],
              gaps: s.gaps ?? [],
              summary: s.summary,
              profile: s.profile ?? {},
            }
          : null,
      };
    })
    .sort((a, b) => {
      const sa = a.score?.match_score ?? -1;
      const sb = b.score?.match_score ?? -1;
      if (sa !== sb) return sb - sa;
      return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
    });

  const reqView: ReqView = {
    id: req.id,
    slug: req.slug,
    title: req.title,
    role_family: req.role_family,
    must_haves: req.must_haves ?? [],
    nice_to_haves: req.nice_to_haves ?? [],
    focus_attributes: req.focus_attributes ?? [],
  };

  return (
    <Shortlist
      req={reqView}
      applications={ranked}
      loadError={appsErr?.message ?? null}
    />
  );
}
