/**
 * Outlined pipeline-stage pill — design.md §5.8.
 * 4 variants used in MVP (TRD §4 status enum: new / shortlisted / saved / rejected).
 */

export type Stage = "new" | "shortlisted" | "saved" | "rejected";

const LABEL: Record<Stage, string> = {
  new: "New",
  shortlisted: "Shortlisted",
  saved: "Saved",
  rejected: "Rejected",
};

const STYLES: Record<Stage, { text: string; border: string; dot: string }> = {
  new: {
    text: "text-stage-new-fg",
    border: "border-stage-new-border",
    dot: "bg-stage-new-dot",
  },
  shortlisted: {
    text: "text-stage-shortlisted-fg",
    border: "border-stage-shortlisted-border",
    dot: "bg-stage-shortlisted-dot",
  },
  saved: {
    text: "text-stage-saved-fg",
    border: "border-stage-saved-border",
    dot: "bg-stage-saved-dot",
  },
  rejected: {
    text: "text-stage-rejected-fg",
    border: "border-stage-rejected-border",
    dot: "bg-stage-rejected-dot",
  },
};

export function StagePill({ stage }: { stage: Stage }) {
  const s = STYLES[stage];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-card pl-1.5 pr-2 py-0.5 text-[11.5px] font-medium ${s.text} ${s.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {LABEL[stage]}
    </span>
  );
}

export const STAGE_LABELS = LABEL;
