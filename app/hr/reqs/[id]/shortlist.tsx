"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StagePill, type Stage } from "@/components/ui/stage-pill";
import { NotScored, ScoreBlock } from "@/components/ui/score-block";
import { RowActions, type ActionKind } from "@/components/ui/row-actions";
import { Button } from "@/components/ui/button";

export interface ReqView {
  id: string;
  slug: string;
  title: string;
  role_family: string;
}

export interface RankedApplication {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: Stage;
  submitted_at: string;
  score: {
    match_score: number;
    strengths: string[];
    gaps: string[];
    summary: string;
  } | null;
}

interface Interviewer {
  id: string;
  name: string;
  email: string;
}

interface Assignment {
  id: string;
  round_label: string;
  created_at: string;
  interviewer: Interviewer | null;
}

interface DetailPayload {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: Stage;
  submitted_at: string;
  resume_signed_url: string | null;
  score: {
    match_score: number;
    must_have_checks: Array<{ requirement: string; met: boolean; evidence: string }>;
    nice_to_have_checks: Array<{ requirement: string; met: boolean; evidence: string }>;
    strengths: string[];
    gaps: string[];
    summary: string;
  } | null;
  assignments: Assignment[];
}

type FilterStage = "all" | Stage;

const STAGE_TABS: Array<{ id: FilterStage; label: string }> = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "saved", label: "Saved" },
  { id: "rejected", label: "Rejected" },
];

export function Shortlist({
  req,
  applications,
  loadError,
}: {
  req: ReqView;
  applications: RankedApplication[];
  loadError: string | null;
}) {
  const [stage, setStage] = useState<FilterStage>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const router = useRouter();

  const stats = useMemo(() => {
    const total = applications.length;
    const scored = applications.filter((a) => a.score).length;
    const toReview = applications.filter((a) => a.status === "new").length;
    const shortlisted = applications.filter((a) => a.status === "shortlisted").length;
    return { total, scored, toReview, shortlisted };
  }, [applications]);

  const stageCounts = useMemo(() => {
    const base: Record<FilterStage, number> = { all: applications.length, new: 0, shortlisted: 0, saved: 0, rejected: 0 };
    for (const a of applications) base[a.status]++;
    return base;
  }, [applications]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((a) => {
      if (stage !== "all" && a.status !== stage) return false;
      if (!q) return true;
      return (a.candidate_name + " " + a.candidate_email + " " + (a.score?.summary ?? ""))
        .toLowerCase()
        .includes(q);
    });
  }, [applications, stage, query]);

  const retry = useCallback(
    async (id: string) => {
      setRetrying(id);
      try {
        const res = await fetch(`/api/applications/${id}/score`, { method: "POST" });
        if (!res.ok) {
          const body: { error?: string } = await res.json().catch(() => ({}));
          alert(body.error ?? `Scoring failed (${res.status}).`);
          return;
        }
        router.refresh();
      } finally {
        setRetrying(null);
      }
    },
    [router],
  );

  const act = useCallback(
    async (id: string, action: ActionKind) => {
      const res = await fetch(`/api/applications/${id}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        alert(body.error ?? `Couldn't update application (${res.status}).`);
        return;
      }
      router.refresh();
    },
    [router],
  );

  return (
    <div>
      <Link
        href="/hr"
        className="mb-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-soft hover:text-ink"
      >
        ← All reqs
      </Link>

      <RoleHeader req={req} stats={stats} />

      <Toolbar
        stage={stage}
        setStage={setStage}
        stageCounts={stageCounts}
        query={query}
        setQuery={setQuery}
      />

      {loadError ? (
        <ErrorCard message={loadError} />
      ) : filtered.length === 0 ? (
        <EmptyState all={applications.length === 0} />
      ) : (
        <ul className="mt-3 space-y-2.5">
          {filtered.map((a) => (
            <CandidateCard
              key={a.id}
              a={a}
              retryingId={retrying}
              onOpen={() => setSelectedId(a.id)}
              onRetry={() => retry(a.id)}
              onAction={(kind) => act(a.id, kind)}
            />
          ))}
        </ul>
      )}

      <SidePanel
        selectedId={selectedId}
        onClose={() => setSelectedId(null)}
        onAction={async (id, kind) => {
          await act(id, kind);
          setSelectedId(null);
        }}
        onRetry={async (id) => {
          await retry(id);
        }}
      />
    </div>
  );
}

// ─── Role header ──────────────────────────────────────────────────────────────

function RoleHeader({
  req,
  stats,
}: {
  req: ReqView;
  stats: { total: number; scored: number; toReview: number; shortlisted: number };
}) {
  return (
    <section className="rounded-lg border border-line bg-card p-6 shadow-card-lg">
      <div className="grid items-start gap-7 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-stage-shortlisted-bg px-2.5 py-1 text-[11.5px] font-medium text-stage-shortlisted-fg">
            <span className="h-1.5 w-1.5 rounded-full bg-stage-shortlisted-dot" />
            Open · accepting applications
          </div>
          <h1 className="mt-2 font-serif text-[40px] leading-[1.05] font-normal -tracking-[0.01em]">
            {req.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13.5px] text-ink-soft">
            <span>{req.role_family}</span>
            <span>·</span>
            <code className="rounded-full bg-line-2 px-3 py-0.5 font-mono text-[12px] text-ink-soft">
              /apply/{req.slug}
            </code>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Kpi label="Applied" value={stats.total} />
          <Kpi label="Scored" value={stats.scored} />
          <Kpi label="To review" value={stats.toReview} focus />
          <Kpi label="Shortlist" value={stats.shortlisted} />
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value, focus }: { label: string; value: number; focus?: boolean }) {
  return (
    <div
      className={`rounded-sm border p-3 ${
        focus ? "border-ink bg-card shadow-kpi-focus" : "border-transparent bg-line-2"
      }`}
    >
      <div className="text-[11px] font-medium tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-[24px] font-semibold -tracking-[0.02em] tabular-nums">{value}</div>
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function Toolbar({
  stage,
  setStage,
  stageCounts,
  query,
  setQuery,
}: {
  stage: FilterStage;
  setStage: (s: FilterStage) => void;
  stageCounts: Record<FilterStage, number>;
  query: string;
  setQuery: (q: string) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-full border border-line bg-[var(--color-glass-60)] p-1 shadow-stages">
        {STAGE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setStage(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              stage === t.id ? "bg-ink text-white" : "text-ink-soft hover:bg-line-2"
            }`}
          >
            {t.id !== "all" && stage !== t.id && (
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  t.id === "new"
                    ? "bg-stage-new-dot"
                    : t.id === "shortlisted"
                    ? "bg-stage-shortlisted-dot"
                    : t.id === "saved"
                    ? "bg-stage-saved-dot"
                    : "bg-stage-rejected-dot"
                }`}
              />
            )}
            {t.label}
            <span className={`text-[11px] tabular-nums ${stage === t.id ? "text-faint" : "text-muted"}`}>
              {stageCounts[t.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-2 w-[var(--container-search)]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="text-muted">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, summary…"
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
        />
      </div>
    </div>
  );
}

// ─── Candidate card ──────────────────────────────────────────────────────────

function CandidateCard({
  a,
  retryingId,
  onOpen,
  onRetry,
  onAction,
}: {
  a: RankedApplication;
  retryingId: string | null;
  onOpen: () => void;
  onRetry: () => void;
  onAction: (kind: ActionKind) => void;
}) {
  return (
    <li
      onClick={onOpen}
      className="cursor-pointer rounded-md border border-line bg-card p-4 shadow-card transition-[border-color,transform] hover:-translate-y-px hover:border-[var(--color-line-hover)]"
    >
      <div className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-start gap-3.5">
        <div className="pt-0.5">
          {a.score ? (
            <ScoreBlock score={a.score.match_score} />
          ) : (
            <NotScored onRetry={onRetry} busy={retryingId === a.id} />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="text-[16px] font-semibold -tracking-[0.01em]">{a.candidate_name}</div>
            <StagePill stage={a.status} />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
            <span className="truncate">{a.candidate_email}</span>
            <span>·</span>
            <span>Applied {formatRel(a.submitted_at)}</span>
          </div>

          {a.score ? (
            <>
              <p className="mt-2.5 max-w-[var(--container-cc-main)] text-[13.5px] leading-[1.5] text-ink-soft">
                {a.score.summary}
              </p>
              {(a.score.strengths.length > 0 || a.score.gaps.length > 0) && (
                <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 border-t border-dashed border-line pt-2.5">
                  {a.score.strengths.slice(0, 3).map((s, i) => (
                    <span key={`s${i}`} className="text-[12px] text-stage-shortlisted-fg">
                      + {s}
                    </span>
                  ))}
                  {a.score.gaps.slice(0, 3).map((g, i) => (
                    <span key={`g${i}`} className="text-[12px] text-stage-rejected-fg">
                      − {g}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="mt-2 text-[12.5px] text-muted">
              Waiting on Gemini — click <b className="text-ink-soft">Retry</b> to score now.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-[11.5px] text-muted">{formatRel(a.submitted_at)}</div>
          <RowActions onAction={onAction} />
        </div>
      </div>
    </li>
  );
}

// ─── Side panel ──────────────────────────────────────────────────────────────

function SidePanel({
  selectedId,
  onClose,
  onAction,
  onRetry,
}: {
  selectedId: string | null;
  onClose: () => void;
  onAction: (id: string, kind: ActionKind) => Promise<void> | void;
  onRetry: (id: string) => Promise<void> | void;
}) {
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailRev, setDetailRev] = useState(0);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/applications/${selectedId}`)
      .then(async (r) => {
        if (!r.ok) {
          const body: { error?: string } = await r.json().catch(() => ({}));
          throw new Error(body.error ?? `Failed (${r.status}).`);
        }
        return (await r.json()) as DetailPayload;
      })
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, detailRev]);

  useEffect(() => {
    if (!selectedId) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [selectedId, onClose]);

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        className={`fixed inset-0 z-[99] bg-[var(--color-backdrop)] backdrop-blur-[3px] transition-opacity duration-200 ${
          selectedId ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[100] flex w-[var(--container-side)] max-w-[95vw] flex-col border-l border-line bg-card shadow-side transition-transform duration-[320ms] ease-[var(--ease-panel)] ${
          selectedId ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!selectedId}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-[10px] border border-line bg-card text-ink-soft hover:bg-line-2 hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>

        {selectedId && loading && !detail && <PanelLoading />}
        {error && <PanelError message={error} />}
        {detail && (
          <PanelContent
            detail={detail}
            onAction={(kind) => onAction(detail.id, kind)}
            onRetry={() => onRetry(detail.id)}
            onAssigned={() => setDetailRev((r) => r + 1)}
          />
        )}
      </aside>
    </>
  );
}

function PanelLoading() {
  return (
    <div className="flex h-full items-center justify-center text-[13px] text-muted">
      Loading candidate…
    </div>
  );
}

function PanelError({ message }: { message: string }) {
  return (
    <div className="m-6 rounded-md border border-stage-rejected-border bg-stage-rejected-bg px-3 py-2 text-[13px] text-stage-rejected-fg">
      {message}
    </div>
  );
}

function PanelContent({
  detail,
  onAction,
  onRetry,
  onAssigned,
}: {
  detail: DetailPayload;
  onAction: (kind: ActionKind) => Promise<void> | void;
  onRetry: () => Promise<void> | void;
  onAssigned: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <header className="border-b border-line p-6 pb-4">
        <StagePill stage={detail.status} />
        <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3.5">
          <div>
            <h2 className="font-serif text-[28px] leading-[1.1] font-normal -tracking-[0.01em]">
              {detail.candidate_name}
            </h2>
            <div className="mt-1 text-[13px] text-ink-soft">{detail.candidate_email}</div>
          </div>
          {detail.score ? (
            <ScoreBlock score={detail.score.match_score} size="lg" />
          ) : (
            <NotScored onRetry={() => onRetry()} />
          )}
        </div>
      </header>

      <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-2 border-b border-line p-6 py-4">
        <Button variant="primary" onClick={() => onAction("shortlist")}>
          <CheckIconSm /> Approve
        </Button>
        <Button variant="ghost" onClick={() => onAction("saved")}>
          <BookmarkIconSm /> Save
        </Button>
        <Button variant="danger-ghost" onClick={() => onAction("rejected")}>
          <XIconSm /> Reject
        </Button>
      </div>

      <section className="border-b border-line px-6 py-4">
        <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
          Resume
        </div>
        {detail.resume_signed_url ? (
          <iframe
            src={detail.resume_signed_url}
            className="h-[420px] w-full rounded-md border border-line bg-line-2"
            title="Resume preview"
          />
        ) : (
          <div className="rounded-md border border-dashed border-line bg-line-2 p-4 text-[12.5px] text-muted">
            Resume preview unavailable.
          </div>
        )}
      </section>

      <AssignmentsSection
        applicationId={detail.id}
        status={detail.status}
        assignments={detail.assignments}
        onAssigned={onAssigned}
      />

      <div className="px-6 pb-6">
        {detail.score ? (
          <>
            <Section title="Summary">
              <p className="text-[14px] leading-[1.55] text-ink">{detail.score.summary}</p>
            </Section>

            <Section title={`Must-haves · ${detail.score.must_have_checks.filter((c) => c.met).length}/${detail.score.must_have_checks.length}`}>
              <Checklist items={detail.score.must_have_checks} />
            </Section>

            <Section title={`Nice-to-haves · ${detail.score.nice_to_have_checks.filter((c) => c.met).length}/${detail.score.nice_to_have_checks.length}`}>
              <Checklist items={detail.score.nice_to_have_checks} />
            </Section>

            <Section title="Strengths">
              <EviList items={detail.score.strengths} />
            </Section>

            <Section title="Gaps" bad>
              <EviList items={detail.score.gaps} bad />
            </Section>
          </>
        ) : (
          <div className="py-6 text-[13px] text-muted">
            This application hasn&apos;t been scored yet. Click Retry above to score with Gemini.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Interviewer assignment section ──────────────────────────────────────────

function AssignmentsSection({
  applicationId,
  status,
  assignments,
  onAssigned,
}: {
  applicationId: string;
  status: Stage;
  assignments: Assignment[];
  onAssigned: () => void;
}) {
  const canAssign = status === "shortlisted";

  return (
    <section className="border-b border-line px-6 py-4">
      <div className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
        Interviews {assignments.length > 0 && <span className="text-ink-soft">· {assignments.length} assigned</span>}
      </div>

      {assignments.length > 0 && (
        <ul className="mb-3 flex flex-col gap-1.5">
          {assignments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-[13px]">
              <span className="inline-flex items-center rounded-full bg-line-2 px-2.5 py-0.5 text-[11.5px] font-medium text-ink-soft">
                {a.round_label}
              </span>
              <span className="text-ink">{a.interviewer?.name ?? "Unknown"}</span>
              {a.interviewer?.email && (
                <span className="truncate text-[12px] text-muted">· {a.interviewer.email}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canAssign ? (
        <AssignForm applicationId={applicationId} onAssigned={onAssigned} />
      ) : (
        <div className="rounded-md border border-dashed border-line bg-line-2 px-3 py-2 text-[12.5px] text-muted">
          Approve this candidate to assign interviewers.
        </div>
      )}
    </section>
  );
}

function AssignForm({
  applicationId,
  onAssigned,
}: {
  applicationId: string;
  onAssigned: () => void;
}) {
  const [interviewers, setInterviewers] = useState<Interviewer[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [round, setRound] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/interviewers")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed (${r.status}).`);
        return (await r.json()) as { interviewers: Interviewer[] };
      })
      .then((d) => {
        if (!cancelled) setInterviewers(d.interviewers);
      })
      .catch((e: Error) => {
        if (!cancelled) setFetchError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (picked.size === 0 || !round.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/assignments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          interviewer_ids: [...picked],
          round_label: round.trim(),
        }),
      });
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status}).`);
      }
      setPicked(new Set());
      setRound("");
      onAssigned();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't assign.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2.5 rounded-md border border-dashed border-line bg-card/70 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        Assign interviewer(s)
      </div>

      {fetchError ? (
        <div className="text-[12px] text-stage-rejected-fg">{fetchError}</div>
      ) : interviewers === null ? (
        <div className="text-[12px] text-muted">Loading interviewers…</div>
      ) : interviewers.length === 0 ? (
        <div className="text-[12px] text-muted">No interviewers in the directory.</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {interviewers.map((i) => {
            const on = picked.has(i.id);
            return (
              <button
                key={i.id}
                type="button"
                onClick={() => toggle(i.id)}
                title={i.email}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors ${
                  on
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-card text-ink-soft hover:border-[var(--color-line-hover)] hover:text-ink"
                }`}
              >
                {i.name}
              </button>
            );
          })}
        </div>
      )}

      <input
        value={round}
        onChange={(e) => setRound(e.target.value)}
        placeholder="Round label (e.g. Screen, Tech, Final)"
        maxLength={50}
        className="w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none placeholder:text-muted focus:border-[var(--color-line-hover)]"
      />

      {error && <div className="text-[12px] text-stage-rejected-fg">{error}</div>}

      <div className="flex items-center justify-between">
        <div className="text-[11.5px] text-muted">
          {picked.size === 0
            ? "Pick one or more interviewers"
            : `${picked.size} selected`}
        </div>
        <Button
          variant="primary"
          onClick={submit}
          disabled={busy || picked.size === 0 || !round.trim()}
        >
          {busy ? "Assigning…" : "Assign"}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode; bad?: boolean }) {
  return (
    <section className="border-b border-line py-3.5 last:border-b-0">
      <h3 className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Checklist({ items }: { items: Array<{ requirement: string; met: boolean; evidence: string }> }) {
  if (items.length === 0) return <div className="text-[12.5px] text-muted">(none)</div>;
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((c, i) => (
        <li
          key={i}
          className={`grid grid-cols-[18px_1fr] items-start gap-2 text-[13px] ${
            c.met ? "text-ink" : "text-muted"
          }`}
          title={c.evidence}
        >
          <span
            className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${
              c.met ? "bg-ink" : "bg-line text-muted"
            }`}
          >
            {c.met ? "✓" : "·"}
          </span>
          <span>{c.requirement}</span>
        </li>
      ))}
    </ul>
  );
}

function EviList({ items, bad }: { items: string[]; bad?: boolean }) {
  if (items.length === 0) return <div className="text-[12.5px] text-muted">(none)</div>;
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((s, i) => (
        <div
          key={i}
          className={`rounded-xs bg-line-2 px-3 py-2 text-[13px] leading-snug ${
            bad ? "border-l-2 border-faint" : "border-l-2 border-ink"
          }`}
        >
          {s}
        </div>
      ))}
    </div>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────────────────

function EmptyState({ all }: { all: boolean }) {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-line bg-card/70 p-12 text-center">
      <p className="text-[13.5px] text-ink-soft">
        {all ? "No applications yet." : "Nothing matches this filter."}
      </p>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="mt-3 rounded-md border border-stage-rejected-border bg-stage-rejected-bg px-4 py-3 text-[13px]">
      <div className="font-medium text-stage-rejected-fg">Couldn&apos;t load applications.</div>
      <div className="mt-0.5 text-ink-soft">{message}</div>
    </div>
  );
}

function formatRel(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const day = 86_400_000;
  const hr = 3_600_000;
  if (diff < hr) return "just now";
  if (diff < day) return `${Math.round(diff / hr)}h ago`;
  const d = Math.round(diff / day);
  return `${d}d ago`;
}

function CheckIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
    </svg>
  );
}
function BookmarkIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-4-7 4V5z" />
    </svg>
  );
}
function XIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
