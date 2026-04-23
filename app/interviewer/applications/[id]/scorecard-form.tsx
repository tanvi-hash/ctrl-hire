"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Rating = 1 | 2 | 3 | 4;
type Recommendation = "strong_hire" | "hire" | "no_hire" | "strong_no_hire";

const BARS_ANCHORS: Record<Rating, string> = {
  1: "Doesn't meet bar",
  2: "Below expectations",
  3: "Meets expectations",
  4: "Exceeds expectations",
};

const RECOMMENDATIONS: Array<{ value: Recommendation; label: string; positive: boolean }> = [
  { value: "strong_hire", label: "Strong Hire", positive: true },
  { value: "hire", label: "Hire", positive: true },
  { value: "no_hire", label: "No Hire", positive: false },
  { value: "strong_no_hire", label: "Strong No Hire", positive: false },
];

export function ScorecardForm({
  assignmentId,
  focusAttributes,
  asParam,
}: {
  assignmentId: string;
  focusAttributes: string[];
  asParam: string;
}) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRating = (attr: string, n: Rating) => {
    setRatings((prev) => ({ ...prev, [attr]: n }));
  };

  const allRated = focusAttributes.every((a) => [1, 2, 3, 4].includes(ratings[a]));
  const canSubmit = allRated && recommendation !== null && !busy;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/scorecards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignmentId,
          ratings,
          notes: notes.trim(),
          recommendation,
        }),
      });
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Submission failed (${res.status}).`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit.");
    } finally {
      setBusy(false);
    }
  }

  if (focusAttributes.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-line bg-line-2 p-4 text-[12.5px] text-muted">
        No focus attributes on the rubric — can&apos;t score. Ask HR to add them.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-1 text-[12px] font-medium text-ink-soft">Focus attributes · 1–4</legend>
        {focusAttributes.map((attr) => (
          <div key={attr} className="rounded-md border border-line bg-card p-4">
            <div className="mb-2.5 text-[14px] font-semibold -tracking-[0.005em]">{attr}</div>
            <div className="flex flex-col gap-1.5">
              {([1, 2, 3, 4] as Rating[]).map((n) => {
                const on = ratings[attr] === n;
                return (
                  <label
                    key={n}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                      on ? "bg-line-2" : "hover:bg-line-2"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`rating-${attr}`}
                      checked={on}
                      onChange={() => setRating(attr, n)}
                      className="accent-[var(--color-ink)]"
                    />
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                        on ? "bg-ink text-white" : "border border-line bg-card text-muted"
                      }`}
                    >
                      {n}
                    </span>
                    <span className={`text-[13px] ${on ? "text-ink" : "text-ink-soft"}`}>
                      {BARS_ANCHORS[n]}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </fieldset>

      <div>
        <label
          htmlFor="notes"
          className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
        >
          Evidence notes
        </label>
        <textarea
          id="notes"
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Concrete examples from the interview — what the candidate did / said."
          className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-[13.5px] leading-[1.55] text-ink outline-none transition-[border-color] placeholder:text-muted focus:border-[var(--color-line-hover)]"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Overall recommendation
        </legend>
        <div className="grid gap-1.5 sm:grid-cols-4">
          {RECOMMENDATIONS.map((r) => {
            const on = recommendation === r.value;
            return (
              <label
                key={r.value}
                className={`flex cursor-pointer items-center justify-center rounded-full border px-3 py-2 text-[12.5px] font-medium transition-colors ${
                  on
                    ? r.positive
                      ? "border-stage-shortlisted-fg bg-stage-shortlisted-bg text-stage-shortlisted-fg"
                      : "border-stage-rejected-fg bg-stage-rejected-bg text-stage-rejected-fg"
                    : "border-line bg-card text-ink-soft hover:border-[var(--color-line-hover)] hover:text-ink"
                }`}
              >
                <input
                  type="radio"
                  name="recommendation"
                  checked={on}
                  onChange={() => setRecommendation(r.value)}
                  className="sr-only"
                />
                {r.label}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-[11.5px] text-muted">
          No neutral option — force a recommendation (PRD §6.2).
        </p>
      </fieldset>

      {error && (
        <div className="rounded-md border border-stage-rejected-border bg-stage-rejected-bg px-3 py-2 text-[13px] text-stage-rejected-fg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-line pt-4">
        <div className="text-[11.5px] text-muted">
          {!allRated
            ? `Rate all ${focusAttributes.length} focus attribute${focusAttributes.length === 1 ? "" : "s"} to continue.`
            : recommendation === null
              ? "Pick a recommendation to continue."
              : "Ready to submit."}
        </div>
        <Button type="submit" variant="primary" disabled={!canSubmit}>
          {busy ? "Submitting…" : "Submit scorecard"}
        </Button>
      </div>

      {/* Preserve ?as= across form POST redirects handled by router.refresh() */}
      <input type="hidden" name="as" value={asParam} />
    </form>
  );
}
