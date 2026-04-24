/**
 * Derived pipeline stage for a candidate.
 *
 * We keep the TRD §4 status enum (new / shortlisted / saved / rejected) as the
 * authoritative DB field, but compute a richer visual stage for the HR surface
 * based on whether the candidate has active interview assignments and whether
 * those rounds have landed scorecards.
 *
 * DB `status`   | scorecards? | → UI stage
 * ──────────────┼─────────────┼───────────────
 * new           | —           | applied
 * shortlisted   | none        | shortlisted
 * shortlisted   | ≥1          | interviewing
 * saved         | —           | saved
 * rejected      | —           | rejected
 */

export type DbStatus = "new" | "shortlisted" | "saved" | "rejected";
export type PipelineStage = "applied" | "shortlisted" | "interviewing" | "saved" | "rejected";

export function computeStage(
  status: DbStatus,
  scorecardCount: number,
): PipelineStage {
  if (status === "new") return "applied";
  if (status === "shortlisted") return scorecardCount > 0 ? "interviewing" : "shortlisted";
  return status; // "saved" | "rejected"
}

export const STAGE_LABEL: Record<PipelineStage, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interviewing: "Interviewing",
  saved: "Saved",
  rejected: "Rejected",
};
