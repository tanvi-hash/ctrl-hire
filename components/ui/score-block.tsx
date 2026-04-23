/**
 * Score-as-hint block — design.md §5.7, §6.4.
 * Renders "X.Y /10" over a thin ink meter. No hue gradient — the point is
 * that score is advisory, not a verdict.
 */

export function ScoreBlock({
  score,
  size = "sm",
}: {
  score: number;
  size?: "sm" | "lg";
}) {
  const outOfTen = (score / 10).toFixed(1);
  const meterWidth = size === "lg" ? "w-20" : "w-11";
  const meterHeight = size === "lg" ? "h-1" : "h-[3px]";
  const numSize = size === "lg" ? "text-[30px]" : "text-[22px]";
  const ofSize = size === "lg" ? "text-[13px]" : "text-[11px]";
  return (
    <div className={`flex flex-col items-${size === "lg" ? "end" : "center"} gap-1`}>
      <div className={`${numSize} leading-none font-semibold -tracking-[0.02em] tabular-nums`}>
        {outOfTen}
        <span className={`ml-0.5 ${ofSize} font-medium text-muted`}>/10</span>
      </div>
      <div className={`${meterWidth} ${meterHeight} overflow-hidden rounded bg-line`}>
        <div className="h-full bg-ink" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
    </div>
  );
}

export function NotScored({
  onRetry,
  busy,
}: {
  onRetry: () => void;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        Not scored
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={busy}
        className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-medium text-ink-soft transition-[border-color,color] hover:border-[var(--color-line-hover)] hover:text-ink disabled:opacity-60"
      >
        {busy ? "Scoring…" : "Retry"}
      </button>
    </div>
  );
}
