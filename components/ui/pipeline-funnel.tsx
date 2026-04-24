"use client";

import type { DbStatus, PipelineStage } from "@/lib/stage";

/**
 * Pipeline funnel — content-hugging chips for each stage, arrows between
 * forward stages, off-pipeline stages to the right of a separator.
 * Clicking a chip filters the candidate list.
 */

export type FunnelCounts = {
  applied: number;
  shortlisted: number;
  interviewing: number;
};

type Forward = "applied" | "shortlisted" | "interviewing";

export function PipelineFunnel({
  counts,
  activeStatus,
  onFilter,
}: {
  counts: FunnelCounts;
  activeStatus: "all" | DbStatus;
  onFilter: (next: "all" | DbStatus) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <Chip
        stage="applied"
        count={counts.applied}
        active={activeStatus === "new"}
        onClick={() => onFilter(activeStatus === "new" ? "all" : "new")}
      />
      <Arrow />
      <Chip
        stage="shortlisted"
        count={counts.shortlisted}
        active={activeStatus === "shortlisted"}
        onClick={() => onFilter(activeStatus === "shortlisted" ? "all" : "shortlisted")}
      />
      <Arrow />
      <Chip
        stage="interviewing"
        count={counts.interviewing}
        active={activeStatus === "shortlisted"}
        onClick={() => onFilter(activeStatus === "shortlisted" ? "all" : "shortlisted")}
      />
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

const STYLE: Record<Forward, { label: string; bg: string; fg: string; dot: string; ring: string; border: string }> = {
  applied: {
    label: "Applied",
    bg: "bg-line-2",
    fg: "text-ink",
    dot: "bg-stage-new-dot",
    ring: "ring-ink",
    border: "border-transparent",
  },
  shortlisted: {
    label: "Shortlisted",
    bg: "bg-stage-shortlisted-bg",
    fg: "text-stage-shortlisted-fg",
    dot: "bg-stage-shortlisted-dot",
    ring: "ring-stage-shortlisted-dot",
    border: "border-transparent",
  },
  interviewing: {
    label: "Interviewing",
    bg: "bg-card",
    fg: "text-stage-screening-fg",
    dot: "bg-stage-screening-dot",
    ring: "ring-stage-screening-dot",
    border: "border-stage-screening-border",
  },
};

function Chip({
  stage,
  count,
  active,
  onClick,
}: {
  stage: Forward;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const s = STYLE[stage];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 transition-[box-shadow,border-color] hover:border-[var(--color-line-hover)] ${s.bg} ${s.border} ${
        active ? `ring-2 ${s.ring}` : ""
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {s.label}
      </span>
      <span className={`text-[16px] font-semibold -tracking-[0.02em] tabular-nums ${s.fg}`}>
        {count}
      </span>
    </button>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="text-faint">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function buildFunnelCounts(
  items: Array<{ status: DbStatus; stage: PipelineStage }>,
): FunnelCounts {
  const c: FunnelCounts = { applied: 0, shortlisted: 0, interviewing: 0 };
  for (const a of items) {
    if (a.stage === "applied") c.applied++;
    else if (a.stage === "shortlisted") c.shortlisted++;
    else if (a.stage === "interviewing") c.interviewing++;
  }
  return c;
}
