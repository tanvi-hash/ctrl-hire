import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ScorecardForm } from "./scorecard-form";

type Recommendation = "strong_hire" | "hire" | "no_hire" | "strong_no_hire";

interface Assignment {
  id: string;
  round_label: string;
  interviewer_id: string;
}

interface Application {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: "new" | "shortlisted" | "saved" | "rejected";
  resume_storage_path: string;
  req_id: string;
}

interface ReqRow {
  title: string;
  role_family: string;
  focus_attributes: string[] | null;
}

interface ScorecardRow {
  id: string;
  assignment_id: string;
  ratings: Record<string, number>;
  notes: string;
  recommendation: Recommendation;
  submitted_at: string;
}

export default async function BriefingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ as?: string }>;
}) {
  const { id: applicationId } = await params;
  const { as } = await searchParams;

  if (!as) redirect("/interviewer");

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: me } = await supabase
    .from("interviewers")
    .select("id, name")
    .eq("id", as)
    .maybeSingle<{ id: string; name: string }>();
  if (!me) redirect("/interviewer");

  // Load this interviewer's assignment for this application.
  const { data: myAssignment } = await supabase
    .from("interview_assignments")
    .select("id, round_label, interviewer_id")
    .eq("interviewer_id", me.id)
    .eq("application_id", applicationId)
    .maybeSingle<Assignment>();
  if (!myAssignment) notFound();

  const { data: app } = await supabase
    .from("applications")
    .select("id, candidate_name, candidate_email, status, resume_storage_path, req_id")
    .eq("id", applicationId)
    .maybeSingle<Application>();
  if (!app) notFound();

  const { data: req } = await supabase
    .from("reqs")
    .select("title, role_family, focus_attributes")
    .eq("id", app.req_id)
    .single<ReqRow>();

  const { data: signed } = await admin.storage
    .from("resumes")
    .createSignedUrl(app.resume_storage_path, 600);

  const { data: myScorecard } = await supabase
    .from("scorecards")
    .select("id, assignment_id, ratings, notes, recommendation, submitted_at")
    .eq("assignment_id", myAssignment.id)
    .maybeSingle<ScorecardRow>();

  const focusAttributes = req?.focus_attributes ?? [];

  // Blind-until-submit: other scorecards are ONLY loaded if I've already submitted.
  // PRD §6.2 — prevents anchoring on earlier impressions.
  let otherScorecards: Array<{
    id: string;
    interviewerName: string;
    roundLabel: string;
    ratings: Record<string, number>;
    notes: string;
    recommendation: Recommendation;
    submitted_at: string;
  }> = [];

  if (myScorecard) {
    const { data: siblingAssignments } = await supabase
      .from("interview_assignments")
      .select("id, interviewer_id, round_label")
      .eq("application_id", applicationId)
      .neq("id", myAssignment.id)
      .returns<Array<{ id: string; interviewer_id: string; round_label: string }>>();

    const sibIds = (siblingAssignments ?? []).map((a) => a.id);
    if (sibIds.length > 0) {
      const { data: sibCards } = await supabase
        .from("scorecards")
        .select("id, assignment_id, ratings, notes, recommendation, submitted_at")
        .in("assignment_id", sibIds)
        .returns<ScorecardRow[]>();

      const ivIds = Array.from(new Set((siblingAssignments ?? []).map((a) => a.interviewer_id)));
      const { data: interviewers } = ivIds.length
        ? await supabase.from("interviewers").select("id, name").in("id", ivIds)
            .returns<Array<{ id: string; name: string }>>()
        : { data: [] as Array<{ id: string; name: string }> };

      const assignmentById = new Map((siblingAssignments ?? []).map((a) => [a.id, a]));
      const interviewerById = new Map((interviewers ?? []).map((i) => [i.id, i]));

      otherScorecards = (sibCards ?? []).map((c) => {
        const a = assignmentById.get(c.assignment_id);
        return {
          id: c.id,
          interviewerName: a ? interviewerById.get(a.interviewer_id)?.name ?? "Unknown" : "Unknown",
          roundLabel: a?.round_label ?? "",
          ratings: c.ratings,
          notes: c.notes,
          recommendation: c.recommendation,
          submitted_at: c.submitted_at,
        };
      });
    }
  }

  return (
    <div className="max-w-4xl">
      <Link
        href={`/interviewer?as=${me.id}`}
        className="mb-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-soft hover:text-ink"
      >
        ← Back to queue
      </Link>

      <section className="rounded-lg border border-line bg-card p-6 shadow-card-lg">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-line-2 px-2.5 py-1 text-[11.5px] font-medium text-ink-soft">
            {myAssignment.round_label}
          </span>
          {myScorecard ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stage-shortlisted-border bg-card px-2 py-0.5 text-[11.5px] font-medium text-stage-shortlisted-fg">
              <span className="h-1.5 w-1.5 rounded-full bg-stage-shortlisted-dot" />
              Scorecard submitted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stage-saved-border bg-card px-2 py-0.5 text-[11.5px] font-medium text-stage-saved-fg">
              <span className="h-1.5 w-1.5 rounded-full bg-stage-saved-dot" />
              Scorecard pending
            </span>
          )}
        </div>
        <h1 className="mt-3 font-serif text-[40px] leading-[1.05] font-normal -tracking-[0.01em]">
          {app.candidate_name}
        </h1>
        <div className="mt-1 text-[13.5px] text-ink-soft">
          {req?.title ?? "Unknown role"}
          {req?.role_family ? <> · {req.role_family}</> : null}
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-line bg-card p-6 shadow-card">
        <h2 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
          Resume
        </h2>
        {signed?.signedUrl ? (
          <iframe
            src={signed.signedUrl}
            className="h-[540px] w-full rounded-md border border-line bg-line-2"
            title="Resume preview"
          />
        ) : (
          <div className="rounded-md border border-dashed border-line bg-line-2 p-4 text-[12.5px] text-muted">
            Resume preview unavailable.
          </div>
        )}
      </section>

      <section className="mt-4 rounded-lg border border-line bg-card p-6 shadow-card">
        <h2 className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
          Focus attributes for this round
        </h2>
        {focusAttributes.length === 0 ? (
          <p className="text-[12.5px] text-muted">
            No focus attributes defined on the rubric. Add them when creating the req.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {focusAttributes.map((f) => (
              <li
                key={f}
                className="inline-flex items-center rounded-full border border-line bg-card px-3 py-1 text-[13px] text-ink"
              >
                {f}
              </li>
            ))}
          </ul>
        )}
      </section>

      {myScorecard ? (
        <SubmittedView scorecard={myScorecard} focusAttributes={focusAttributes} />
      ) : (
        <FormPanel
          assignmentId={myAssignment.id}
          focusAttributes={focusAttributes}
          asParam={me.id}
        />
      )}

      {myScorecard ? (
        <OtherScorecardsSection
          others={otherScorecards}
          focusAttributes={focusAttributes}
        />
      ) : (
        <BlindNotice />
      )}
    </div>
  );
}

// ─── Form / submitted view ───────────────────────────────────────────────────

function FormPanel({
  assignmentId,
  focusAttributes,
  asParam,
}: {
  assignmentId: string;
  focusAttributes: string[];
  asParam: string;
}) {
  return (
    <section className="mt-4 rounded-lg border border-line bg-card p-6 shadow-card">
      <h2 className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
        Your scorecard
      </h2>
      <p className="mb-4 text-[12.5px] text-muted">
        Rate each focus attribute on the 1–4 BARS scale, leave evidence notes, and pick an
        overall recommendation. Submission is final.
      </p>
      <ScorecardForm
        assignmentId={assignmentId}
        focusAttributes={focusAttributes}
        asParam={asParam}
      />
    </section>
  );
}

function SubmittedView({
  scorecard,
  focusAttributes,
}: {
  scorecard: { ratings: Record<string, number>; notes: string; recommendation: string; submitted_at: string };
  focusAttributes: string[];
}) {
  return (
    <section className="mt-4 rounded-lg border border-line bg-card p-6 shadow-card">
      <h2 className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
        Your scorecard · submitted {new Date(scorecard.submitted_at).toLocaleString()}
      </h2>
      <RatingsDisplay ratings={scorecard.ratings} focusAttributes={focusAttributes} />
      {scorecard.notes && (
        <div className="mt-4 rounded-md bg-line-2 px-4 py-3 text-[13.5px] leading-[1.55] text-ink">
          {scorecard.notes}
        </div>
      )}
      <div className="mt-4">
        <RecommendationPill value={scorecard.recommendation} />
      </div>
    </section>
  );
}

// ─── Blind-until-submit boundary ────────────────────────────────────────────

function BlindNotice() {
  return (
    <section className="mt-4 rounded-lg border border-dashed border-line bg-card/70 p-5 text-[13px] text-ink-soft">
      <b className="text-ink">Blind until submit.</b> Other interviewers&apos; scorecards for
      this candidate become visible after your own is submitted (PRD §6.2 — prevents anchoring
      on earlier impressions).
    </section>
  );
}

function OtherScorecardsSection({
  others,
  focusAttributes,
}: {
  others: Array<{
    id: string;
    interviewerName: string;
    roundLabel: string;
    ratings: Record<string, number>;
    notes: string;
    recommendation: string;
    submitted_at: string;
  }>;
  focusAttributes: string[];
}) {
  if (others.length === 0) {
    return (
      <section className="mt-4 rounded-lg border border-line bg-card p-5 text-[13px] text-ink-soft">
        No other scorecards yet.
      </section>
    );
  }
  return (
    <section className="mt-4 space-y-3">
      <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
        Other scorecards · {others.length}
      </h2>
      {others.map((o) => (
        <div key={o.id} className="rounded-lg border border-line bg-card p-5 shadow-card">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-line-2 px-2.5 py-0.5 text-[11.5px] font-medium text-ink-soft">
              {o.roundLabel}
            </span>
            <span className="text-[13.5px] font-semibold">{o.interviewerName}</span>
            <span className="text-[12px] text-muted">
              · {new Date(o.submitted_at).toLocaleString()}
            </span>
          </div>
          <RatingsDisplay ratings={o.ratings} focusAttributes={focusAttributes} />
          {o.notes && (
            <div className="mt-3 rounded-md bg-line-2 px-4 py-3 text-[13px] leading-[1.55] text-ink">
              {o.notes}
            </div>
          )}
          <div className="mt-3">
            <RecommendationPill value={o.recommendation} />
          </div>
        </div>
      ))}
    </section>
  );
}

// ─── Shared display bits ────────────────────────────────────────────────────

function RatingsDisplay({
  ratings,
  focusAttributes,
}: {
  ratings: Record<string, number>;
  focusAttributes: string[];
}) {
  const entries = focusAttributes.length > 0 ? focusAttributes : Object.keys(ratings);
  if (entries.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((attr) => {
        const val = ratings[attr] ?? 0;
        return (
          <li key={attr} className="flex items-center justify-between gap-4">
            <span className="text-[13.5px] text-ink">{attr}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                    n <= val
                      ? "bg-ink text-white"
                      : "border border-line bg-card text-muted"
                  }`}
                >
                  {n}
                </span>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const REC_LABEL: Record<string, string> = {
  strong_hire: "Strong Hire",
  hire: "Hire",
  no_hire: "No Hire",
  strong_no_hire: "Strong No Hire",
};

function RecommendationPill({ value }: { value: string }) {
  const positive = value === "strong_hire" || value === "hire";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium ${
        positive
          ? "border-stage-shortlisted-border bg-stage-shortlisted-bg text-stage-shortlisted-fg"
          : "border-stage-rejected-border bg-stage-rejected-bg text-stage-rejected-fg"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          positive ? "bg-stage-shortlisted-dot" : "bg-stage-rejected-dot"
        }`}
      />
      {REC_LABEL[value] ?? value}
    </span>
  );
}
