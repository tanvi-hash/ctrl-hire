/**
 * Score-as-hint block — design.md §5.7, §6.4.
 * "X.Y /10" over a thin ink meter with a small tier label above.
 * No hue gradient: the point is that score is advisory, not a verdict.
 */

export type ScoreSize = "sm" | "md" | "lg";

function tierOf(score: number): string {
  if (score >= 90) return "Strong match";
  if (score >= 75) return "Good match";
  if (score >= 60) return "Partial match";
  return "Weak match";
}

export function ScoreBlock({ score, size = "sm" }: { score: number; size?: ScoreSize }) {
  const outOfTen = (score / 10).toFixed(1);
  const alignClass = size === "lg" ? "items-end" : "items-start";
  const numSize = size === "lg" ? "text-[28px]" : size === "md" ? "text-[22px]" : "text-[20px]";
  const ofSize = size === "lg" ? "text-[13px]" : "text-[11px]";
  const meterWidth = size === "lg" ? "w-24" : "w-14";
  const meterH = size === "lg" ? "h-1" : "h-[3px]";

  return (
    <div className={`flex flex-col gap-1 ${alignClass}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {tierOf(score)}
      </div>
      <div className={`leading-none font-semibold -tracking-[0.02em] tabular-nums ${numSize}`}>
        {outOfTen}
        <span className={`ml-0.5 font-medium text-muted ${ofSize}`}>/10</span>
      </div>
      <div className={`${meterWidth} ${meterH} overflow-hidden rounded bg-line`}>
        <div className="h-full bg-ink" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
    </div>
  );
}

export function NotScored({
  onRetry,
  busy,
  size = "sm",
}: {
  onRetry: () => void;
  busy?: boolean;
  size?: "sm" | "lg";
}) {
  const alignClass = size === "lg" ? "items-end" : "items-start";
  return (
    <div className={`flex flex-col gap-1 ${alignClass}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Not scored</div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRetry();
        }}
        disabled={busy}
        className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-[border-color,color] hover:border-[var(--color-line-hover)] hover:text-ink disabled:opacity-60"
      >
        {busy ? "Scoring…" : "Retry"}
      </button>
    </div>
  );
}
