"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StagePill } from "@/components/ui/stage-pill";
import { SourcePill } from "@/components/ui/source-pill";
import { NotScored, ScoreBlock } from "@/components/ui/score-block";
import { RowActions, type ActionKind } from "@/components/ui/row-actions";
import { Button } from "@/components/ui/button";
import { AddCandidateButton } from "@/components/ui/add-candidate-button";
import { ViewJdButton } from "@/components/ui/view-jd-dialog";
import { ViewToggle } from "@/components/ui/view-toggle";
import { type DbStatus, type PipelineStage } from "@/lib/stage";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReqView {
  id: string;
  slug: string;
  title: string;
  role_family: string;
  must_haves: string[];
  nice_to_haves: string[];
  focus_attributes: string[];
}

export interface Profile {
  current_company?: string | null;
  current_title?: string | null;
  location?: string | null;
  years_of_experience?: number | null;
  phone?: string | null;
}

export interface RankedApplication {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: DbStatus;
  stage: PipelineStage;
  submitted_at: string;
  source: string | null;
  score: {
    match_score: number;
    strengths: string[];
    gaps: string[];
    summary: string;
    profile: Profile;
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
  status: DbStatus;
  submitted_at: string;
  source: string | null;
  resume_signed_url: string | null;
  score: {
    match_score: number;
    must_have_checks: Array<{ requirement: string; met: boolean; evidence: string }>;
    nice_to_have_checks: Array<{ requirement: string; met: boolean; evidence: string }>;
    strengths: string[];
    gaps: string[];
    summary: string;
    profile: Profile;
  } | null;
  assignments: Assignment[];
}

type FilterStatus = "all" | DbStatus;

const STATUS_TABS: Array<{ id: FilterStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "saved", label: "Saved" },
  { id: "rejected", label: "Rejected" },
];

// ─── Main ────────────────────────────────────────────────────────────────────

export function Shortlist({
  req,
  applications,
  loadError,
}: {
  req: ReqView;
  applications: RankedApplication[];
  loadError: string | null;
}) {
  const [status, setStatus] = useState<FilterStatus>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"card" | "list">("card");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const router = useRouter();

  const statusCounts = useMemo(() => {
    const base: Record<FilterStatus, number> = {
      all: applications.length,
      new: 0,
      shortlisted: 0,
      saved: 0,
      rejected: 0,
    };
    for (const a of applications) base[a.status]++;
    return base;
  }, [applications]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (!q) return true;
      const hay =
        a.candidate_name +
        " " +
        a.candidate_email +
        " " +
        (a.score?.summary ?? "") +
        " " +
        (a.score?.profile.current_company ?? "") +
        " " +
        (a.score?.profile.location ?? "");
      return hay.toLowerCase().includes(q);
    });
  }, [applications, status, query]);

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

  const addCandidate = useCallback(() => {
    // Candidate intake is self-serve via the apply URL. The button copies it
    // to the clipboard so HR can share it externally.
    const url = `${window.location.origin}/apply/${req.slug}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    alert(`Candidate URL copied:\n${url}`);
  }, [req.slug]);

  return (
    <div>
      <Link
        href="/hr"
        className="mb-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-soft hover:text-ink"
      >
        ← All reqs
      </Link>

      <RoleHeader req={req} />

      <Toolbar
        status={status}
        setStatus={setStatus}
        statusCounts={statusCounts}
        query={query}
        setQuery={setQuery}
        view={view}
        setView={setView}
        onAdd={addCandidate}
      />

      {loadError ? (
        <ErrorCard message={loadError} />
      ) : filtered.length === 0 ? (
        <EmptyState all={applications.length === 0} />
      ) : view === "card" ? (
        <CardList
          items={filtered}
          retryingId={retrying}
          onOpen={(id) => setSelectedId(id)}
          onRetry={retry}
          onAction={act}
        />
      ) : (
        <ListTable
          items={filtered}
          retryingId={retrying}
          onOpen={(id) => setSelectedId(id)}
          onRetry={retry}
          onAction={act}
        />
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

function RoleHeader({ req }: { req: ReqView }) {
  return (
    <section className="rounded-lg border border-line bg-card p-6 shadow-card-lg">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-stage-shortlisted-bg px-2.5 py-1 text-[11.5px] font-medium text-stage-shortlisted-fg">
          <span className="h-1.5 w-1.5 rounded-full bg-stage-shortlisted-dot" />
          Open · accepting applications
        </div>
        <ViewJdButton
          title={req.title}
          role_family={req.role_family}
          slug={req.slug}
          must_haves={req.must_haves}
          nice_to_haves={req.nice_to_haves}
          focus_attributes={req.focus_attributes}
        />
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
    </section>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function Toolbar({
  status,
  setStatus,
  statusCounts,
  query,
  setQuery,
  view,
  setView,
  onAdd,
}: {
  status: FilterStatus;
  setStatus: (s: FilterStatus) => void;
  statusCounts: Record<FilterStatus, number>;
  query: string;
  setQuery: (q: string) => void;
  view: "card" | "list";
  setView: (v: "card" | "list") => void;
  onAdd: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-full border border-line bg-[var(--color-glass-60)] p-1 shadow-stages">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setStatus(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              status === t.id ? "bg-ink text-white" : "text-ink-soft hover:bg-line-2"
            }`}
          >
            {t.id !== "all" && status !== t.id && (
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
            <span className={`text-[11px] tabular-nums ${status === t.id ? "text-faint" : "text-muted"}`}>
              {statusCounts[t.id]}
            </span>
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-2 w-[var(--container-search)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="text-muted">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, company, location…"
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
          />
        </div>
        <ViewToggle view={view} onChange={setView} />
        <AddCandidateButton onClick={onAdd} />
      </div>
    </div>
  );
}

// ─── Card view ────────────────────────────────────────────────────────────────

function CardList({
  items,
  retryingId,
  onOpen,
  onRetry,
  onAction,
}: {
  items: RankedApplication[];
  retryingId: string | null;
  onOpen: (id: string) => void;
  onRetry: (id: string) => void;
  onAction: (id: string, kind: ActionKind) => void;
}) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((a) => (
        <CandidateCard
          key={a.id}
          a={a}
          retryingId={retryingId}
          onOpen={() => onOpen(a.id)}
          onRetry={() => onRetry(a.id)}
          onAction={(k) => onAction(a.id, k)}
        />
      ))}
    </ul>
  );
}

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
  const p = a.score?.profile ?? {};
  const firstStrength = a.score?.strengths[0];
  const firstGap = a.score?.gaps[0];

  return (
    <li
      onClick={onOpen}
      className="cursor-pointer rounded-md border border-line bg-card p-4 shadow-card transition-[border-color,transform] hover:-translate-y-px hover:border-[var(--color-line-hover)]"
    >
      <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-start gap-4">
        <div className="pt-0.5">
          {a.score ? (
            <ScoreBlock score={a.score.match_score} size="md" />
          ) : (
            <NotScored onRetry={onRetry} busy={retryingId === a.id} />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[16px] font-semibold -tracking-[0.01em]">{a.candidate_name}</div>
            <StagePill stage={a.stage} />
            {a.source && <SourcePill source={a.source} />}
          </div>

          <CompactMeta
            email={a.candidate_email}
            phone={p.phone}
            company={p.current_company}
            title={p.current_title}
            location={p.location}
            yoe={p.years_of_experience}
            appliedAt={a.submitted_at}
          />

          {a.score?.summary && (
            <p className="mt-2.5 max-w-[var(--container-cc-main)] truncate text-[13.5px] leading-[1.45] text-ink-soft">
              {a.score.summary}
            </p>
          )}

          {(firstStrength || firstGap) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {firstStrength && (
                <span className="inline-flex items-center gap-1 rounded-md bg-stage-shortlisted-bg px-2 py-0.5 text-[11.5px] text-stage-shortlisted-fg">
                  <span className="font-semibold">+</span>
                  <span className="truncate max-w-[28ch]">{firstStrength}</span>
                  {a.score!.strengths.length > 1 && (
                    <span className="text-muted">· +{a.score!.strengths.length - 1} more</span>
                  )}
                </span>
              )}
              {firstGap && (
                <span className="inline-flex items-center gap-1 rounded-md bg-stage-rejected-bg px-2 py-0.5 text-[11.5px] text-stage-rejected-fg">
                  <span className="font-semibold">−</span>
                  <span className="truncate max-w-[28ch]">{firstGap}</span>
                  {a.score!.gaps.length > 1 && (
                    <span className="text-muted">· +{a.score!.gaps.length - 1} more</span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center">
          <RowActions onAction={onAction} />
        </div>
      </div>
    </li>
  );
}

function CompactMeta({
  email,
  phone,
  company,
  title,
  location,
  yoe,
  appliedAt,
}: {
  email: string;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  location?: string | null;
  yoe?: number | null;
  appliedAt: string;
}) {
  const current = [title, company].filter(Boolean).join(" at ");
  const parts: Array<string | null | undefined> = [
    current || null,
    location || null,
    yoe != null ? `${yoe} yrs` : null,
    `Applied ${formatRel(appliedAt)}`,
  ];
  const chips = parts.filter((x): x is string => Boolean(x));

  return (
    <div className="mt-1 text-[12.5px] text-muted">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {chips.map((c, i) => (
          <span key={i} className={i === 0 ? "text-ink-soft" : ""}>
            {c}
            {i < chips.length - 1 && <span className="ml-2 text-faint">·</span>}
          </span>
        ))}
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
        <span className="text-ink-soft">{email}</span>
        {phone && (
          <>
            <span className="text-faint">·</span>
            <span>{phone}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── List view (true table) ──────────────────────────────────────────────────

function ListTable({
  items,
  retryingId,
  onOpen,
  onRetry,
  onAction,
}: {
  items: RankedApplication[];
  retryingId: string | null;
  onOpen: (id: string) => void;
  onRetry: (id: string) => void;
  onAction: (id: string, kind: ActionKind) => void;
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-line bg-card shadow-table">
      <table className="w-full min-w-[1180px] text-[13px]">
        <thead className="bg-line-2 text-[10.5px] uppercase tracking-[0.1em] text-muted">
          <tr className="[&>th]:border-b [&>th]:border-line [&>th]:px-3 [&>th]:py-2.5 [&>th]:text-left [&>th]:font-semibold">
            <th className="w-[96px]">Score</th>
            <th className="min-w-[180px]">Candidate</th>
            <th className="min-w-[170px]">Current</th>
            <th className="min-w-[120px]">Location</th>
            <th className="w-[60px] text-center">YOE</th>
            <th className="min-w-[160px]">Contact</th>
            <th className="w-[120px]">Source</th>
            <th className="w-[130px]">Stage</th>
            <th className="w-[116px] text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => {
            const p = a.score?.profile ?? {};
            return (
              <tr
                key={a.id}
                onClick={() => onOpen(a.id)}
                className="cursor-pointer transition-colors [&>td]:border-b [&>td]:border-line-3 [&>td]:px-3 [&>td]:py-3 hover:bg-hover"
              >
                <td>
                  {a.score ? (
                    <ScoreBlock score={a.score.match_score} size="sm" />
                  ) : (
                    <NotScored onRetry={() => onRetry(a.id)} busy={retryingId === a.id} />
                  )}
                </td>
                <td>
                  <div className="font-semibold -tracking-[0.005em]">{a.candidate_name}</div>
                  {a.score?.summary && (
                    <div className="mt-0.5 truncate max-w-[32ch] text-[12px] text-muted">
                      {a.score.summary}
                    </div>
                  )}
                </td>
                <td className="text-ink-soft">
                  {p.current_title && p.current_company
                    ? <><span className="text-ink">{p.current_title}</span> at {p.current_company}</>
                    : p.current_title || p.current_company || <span className="text-muted">—</span>}
                </td>
                <td>{p.location ?? <span className="text-muted">—</span>}</td>
                <td className="text-center tabular-nums">
                  {p.years_of_experience ?? <span className="text-muted">—</span>}
                </td>
                <td>
                  <div className="text-[12.5px] text-ink-soft">{a.candidate_email}</div>
                  {p.phone && <div className="text-[12px] text-muted">{p.phone}</div>}
                </td>
                <td>{a.source ? <SourcePill source={a.source} /> : <span className="text-muted">—</span>}</td>
                <td><StagePill stage={a.stage} /></td>
                <td className="text-right">
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <RowActions onAction={(k) => onAction(a.id, k)} size="sm" />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Side panel ───────────────────────────────────────────────────────────────

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
  const p = detail.score?.profile ?? {};
  // Compute the derived stage for the panel too — same rule as in server.
  const submittedCount = detail.assignments.length; // we don't know per-sc here; assignments alone are a passable proxy for "interviewing" signal in the panel
  const stage: PipelineStage =
    detail.status === "shortlisted"
      ? submittedCount > 0
        ? "interviewing"
        : "shortlisted"
      : detail.status === "new"
        ? "applied"
        : detail.status;

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="border-b border-line p-6 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <StagePill stage={stage} />
          {detail.source && <SourcePill source={detail.source} />}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3.5">
          <div>
            <h2 className="font-serif text-[28px] leading-[1.1] font-normal -tracking-[0.01em]">
              {detail.candidate_name}
            </h2>
            <div className="mt-1 text-[13px] text-ink-soft">{detail.candidate_email}</div>
            {p.phone && <div className="text-[13px] text-ink-soft">{p.phone}</div>}
          </div>
          {detail.score ? (
            <ScoreBlock score={detail.score.match_score} size="lg" />
          ) : (
            <NotScored onRetry={() => onRetry()} size="lg" />
          )}
        </div>

        <ProfileGrid profile={p} />
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
        <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">Resume</div>
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

            <Section
              title={`Must-haves · ${detail.score.must_have_checks.filter((c) => c.met).length}/${detail.score.must_have_checks.length}`}
            >
              <Checklist items={detail.score.must_have_checks} />
            </Section>

            <Section
              title={`Nice-to-haves · ${detail.score.nice_to_have_checks.filter((c) => c.met).length}/${detail.score.nice_to_have_checks.length}`}
            >
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

function ProfileGrid({ profile }: { profile: Profile }) {
  const rows = [
    profile.current_title || profile.current_company
      ? { label: "Current", value: [profile.current_title, profile.current_company].filter(Boolean).join(" at ") }
      : null,
    profile.location ? { label: "Location", value: profile.location } : null,
    profile.years_of_experience != null ? { label: "Experience", value: `${profile.years_of_experience} yrs` } : null,
  ].filter((x): x is { label: string; value: string } => Boolean(x));
  if (rows.length === 0) return null;
  return (
    <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-1 rounded-md bg-line-2 p-3">
      {rows.map((r, i) => (
        <div key={i}>
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">{r.label}</dt>
          <dd className="mt-0.5 text-[13px] text-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
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
  status: DbStatus;
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
          {picked.size === 0 ? "Pick one or more interviewers" : `${picked.size} selected`}
        </div>
        <Button variant="primary" onClick={submit} disabled={busy || picked.size === 0 || !round.trim()}>
          {busy ? "Assigning…" : "Assign"}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode; bad?: boolean }) {
  return (
    <section className="border-b border-line py-3.5 last:border-b-0">
      <h3 className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Checklist({
  items,
}: {
  items: Array<{ requirement: string; met: boolean; evidence: string }>;
}) {
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

// ─── Misc ────────────────────────────────────────────────────────────────────

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

