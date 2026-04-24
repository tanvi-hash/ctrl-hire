import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreResume } from "@/lib/gemini";

export type ScoringResult = { ok: true } | { ok: false; error: string };

interface ApplicationRow {
  id: string;
  req_id: string;
  resume_storage_path: string;
}

interface ReqRubricRow {
  title: string;
  role_family: string;
  must_haves: string[] | null;
  nice_to_haves: string[] | null;
  focus_attributes: string[] | null;
}

/**
 * Load the application + rubric + resume, call Gemini, and upsert a Score row.
 *
 * - No automatic retries on failure (TRD §5). A failed call leaves the
 *   Application with no Score row — the HR list surfaces a "Retry" button.
 * - Called synchronously at application submit, and again from the retry
 *   endpoint `/api/applications/:id/score`.
 */
export async function scoreApplication(applicationId: string): Promise<ScoringResult> {
  const supabase = createAdminClient();

  const { data: app, error: appErr } = await supabase
    .from("applications")
    .select("id, req_id, resume_storage_path")
    .eq("id", applicationId)
    .single<ApplicationRow>();
  if (appErr || !app) {
    return { ok: false, error: `Application not found: ${appErr?.message ?? "unknown"}` };
  }

  const { data: reqRow, error: reqErr } = await supabase
    .from("reqs")
    .select("title, role_family, must_haves, nice_to_haves, focus_attributes")
    .eq("id", app.req_id)
    .single<ReqRubricRow>();
  if (reqErr || !reqRow) {
    return { ok: false, error: `Requisition not found: ${reqErr?.message ?? "unknown"}` };
  }

  const { data: blob, error: dlErr } = await supabase.storage
    .from("resumes")
    .download(app.resume_storage_path);
  if (dlErr || !blob) {
    return { ok: false, error: `Couldn't fetch resume: ${dlErr?.message ?? "unknown"}` };
  }
  const resumeBytes = new Uint8Array(await blob.arrayBuffer());

  let score;
  try {
    score = await scoreResume({
      rubric: {
        title: reqRow.title,
        role_family: reqRow.role_family,
        must_haves: reqRow.must_haves ?? [],
        nice_to_haves: reqRow.nice_to_haves ?? [],
        focus_attributes: reqRow.focus_attributes ?? [],
      },
      resumePdf: resumeBytes,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gemini call failed",
    };
  }

  const { error: upsertErr } = await supabase
    .from("scores")
    .upsert(
      {
        application_id: applicationId,
        match_score: score.match_score,
        must_have_checks: score.must_have_checks,
        nice_to_have_checks: score.nice_to_have_checks,
        strengths: score.strengths,
        gaps: score.gaps,
        summary: score.summary,
        profile: score.profile ?? {},
        scored_at: new Date().toISOString(),
      },
      { onConflict: "application_id" },
    );

  if (upsertErr) {
    return { ok: false, error: `Couldn't write score: ${upsertErr.message}` };
  }

  return { ok: true };
}
