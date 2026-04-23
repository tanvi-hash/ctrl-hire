import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface Interviewer {
  id: string;
  name: string;
  email: string;
}

interface AssignmentRow {
  id: string;
  application_id: string;
  round_label: string;
  created_at: string;
}

interface AppRow {
  id: string;
  candidate_name: string;
  req_id: string;
  status: "new" | "shortlisted" | "saved" | "rejected";
}

interface ReqRow {
  id: string;
  title: string;
  role_family: string;
}

export default async function InterviewerLanding({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const { as } = await searchParams;
  const supabase = await createClient();

  if (!as) {
    const { data: interviewers } = await supabase
      .from("interviewers")
      .select("id, name, email")
      .order("name")
      .returns<Interviewer[]>();
    return <Picker interviewers={interviewers ?? []} />;
  }

  const { data: me } = await supabase
    .from("interviewers")
    .select("id, name, email")
    .eq("id", as)
    .maybeSingle<Interviewer>();

  if (!me) return <UnknownInterviewer />;

  const { data: assignments } = await supabase
    .from("interview_assignments")
    .select("id, application_id, round_label, created_at")
    .eq("interviewer_id", me.id)
    .order("created_at", { ascending: false })
    .returns<AssignmentRow[]>();

  const appIds = (assignments ?? []).map((a) => a.application_id);
  const { data: apps } = appIds.length
    ? await supabase
        .from("applications")
        .select("id, candidate_name, req_id, status")
        .in("id", appIds)
        .returns<AppRow[]>()
    : { data: [] as AppRow[] };

  const reqIds = Array.from(new Set((apps ?? []).map((a) => a.req_id)));
  const { data: reqs } = reqIds.length
    ? await supabase
        .from("reqs")
        .select("id, title, role_family")
        .in("id", reqIds)
        .returns<ReqRow[]>()
    : { data: [] as ReqRow[] };

  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: cards } = assignmentIds.length
    ? await supabase
        .from("scorecards")
        .select("assignment_id, submitted_at")
        .in("assignment_id", assignmentIds)
        .returns<Array<{ assignment_id: string; submitted_at: string }>>()
    : { data: [] as Array<{ assignment_id: string; submitted_at: string }> };

  const appsById = new Map((apps ?? []).map((a) => [a.id, a]));
  const reqsById = new Map((reqs ?? []).map((r) => [r.id, r]));
  const submittedSet = new Set((cards ?? []).map((c) => c.assignment_id));

  const queue = (assignments ?? []).map((a) => {
    const app = appsById.get(a.application_id);
    const req = app ? reqsById.get(app.req_id) : undefined;
    return {
      assignmentId: a.id,
      applicationId: a.application_id,
      candidateName: app?.candidate_name ?? "Unknown candidate",
      roleTitle: req?.title ?? "Unknown role",
      roleFamily: req?.role_family ?? "",
      roundLabel: a.round_label,
      submitted: submittedSet.has(a.id),
    };
  });

  const pending = queue.filter((q) => !q.submitted).length;

  return <Queue me={me} queue={queue} pending={pending} />;
}

// ─── Picker (no ?as= set) ────────────────────────────────────────────────────

function Picker({ interviewers }: { interviewers: Interviewer[] }) {
  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-5">
        <h1 className="font-serif text-[40px] leading-[1.05] font-normal -tracking-[0.01em]">
          Interviewer
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-soft">
          Pick your identity to see your interview queue. Stubbed auth — MVP.
        </p>
      </header>

      {interviewers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-card/70 p-10 text-center text-[13.5px] text-ink-soft">
          No interviewers in the directory.
        </div>
      ) : (
        <ul className="space-y-2">
          {interviewers.map((i) => (
            <li key={i.id}>
              <Link
                href={`/interviewer?as=${i.id}`}
                className="flex items-center justify-between rounded-md border border-line bg-card px-5 py-4 shadow-card transition-[border-color,transform] hover:-translate-y-px hover:border-[var(--color-line-hover)]"
              >
                <div>
                  <div className="text-[16px] font-semibold -tracking-[0.01em]">{i.name}</div>
                  <div className="mt-0.5 text-[12.5px] text-muted">{i.email}</div>
                </div>
                <span className="text-[12.5px] font-medium text-ink-soft">Continue →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Queue (with ?as= set) ───────────────────────────────────────────────────

function Queue({
  me,
  queue,
  pending,
}: {
  me: Interviewer;
  queue: Array<{
    assignmentId: string;
    applicationId: string;
    candidateName: string;
    roleTitle: string;
    roleFamily: string;
    roundLabel: string;
    submitted: boolean;
  }>;
  pending: number;
}) {
  return (
    <div className="max-w-4xl">
      <Link
        href="/interviewer"
        className="mb-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-soft hover:text-ink"
      >
        ← Switch interviewer
      </Link>

      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[40px] leading-[1.05] font-normal -tracking-[0.01em]">
            Your queue
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-soft">
            Signed in as <b className="text-ink">{me.name}</b> · {me.email}
          </p>
        </div>
        <div className="flex gap-2">
          <KpiPill label="Assigned" value={queue.length} />
          <KpiPill label="Pending" value={pending} focus />
        </div>
      </header>

      {queue.length === 0 ? (
        <EmptyQueue />
      ) : (
        <ul className="space-y-2.5">
          {queue.map((q) => (
            <li key={q.assignmentId}>
              <Link
                href={`/interviewer/applications/${q.applicationId}?as=${me.id}`}
                className="block rounded-md border border-line bg-card p-5 shadow-card transition-[border-color,transform] hover:-translate-y-px hover:border-[var(--color-line-hover)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-[18px] font-semibold -tracking-[0.01em]">
                        {q.candidateName}
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-line-2 px-2.5 py-0.5 text-[11.5px] font-medium text-ink-soft">
                        {q.roundLabel}
                      </span>
                      {q.submitted ? (
                        <SubmittedPill />
                      ) : (
                        <PendingPill />
                      )}
                    </div>
                    <div className="mt-1 text-[13px] text-muted">
                      {q.roleTitle}
                      {q.roleFamily ? <> · {q.roleFamily}</> : null}
                    </div>
                  </div>
                  <span className="shrink-0 text-[12.5px] font-medium text-ink-soft">
                    {q.submitted ? "View →" : "Open briefing →"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function KpiPill({ label, value, focus }: { label: string; value: number; focus?: boolean }) {
  return (
    <div
      className={`rounded-md border px-4 py-2 ${
        focus ? "border-ink bg-card shadow-kpi-focus" : "border-line bg-line-2"
      }`}
    >
      <div className="text-[11px] font-medium tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 text-[20px] font-semibold -tracking-[0.02em] tabular-nums">{value}</div>
    </div>
  );
}

function PendingPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-stage-saved-border bg-card px-2 py-0.5 text-[11.5px] font-medium text-stage-saved-fg">
      <span className="h-1.5 w-1.5 rounded-full bg-stage-saved-dot" />
      Pending
    </span>
  );
}

function SubmittedPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-stage-shortlisted-border bg-card px-2 py-0.5 text-[11.5px] font-medium text-stage-shortlisted-fg">
      <span className="h-1.5 w-1.5 rounded-full bg-stage-shortlisted-dot" />
      Submitted
    </span>
  );
}

function EmptyQueue() {
  return (
    <div className="rounded-lg border border-dashed border-line bg-card/70 p-12 text-center">
      <p className="text-[13.5px] text-ink-soft">
        Nothing in your queue yet. Assignments from HR show up here.
      </p>
    </div>
  );
}

function UnknownInterviewer() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-stage-rejected-border bg-stage-rejected-bg p-6 text-[13.5px] text-stage-rejected-fg">
      This interviewer id isn&apos;t in the directory.{" "}
      <Link href="/interviewer" className="underline">
        Pick again.
      </Link>
    </div>
  );
}
