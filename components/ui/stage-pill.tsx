import { PipelineStage, STAGE_LABEL } from "@/lib/stage";

/**
 * Outlined pipeline-stage pill — design.md §5.8.
 * 5 variants now that we derive `interviewing` from assignments + scorecards.
 */

export type Stage = PipelineStage;

const STYLES: Record<PipelineStage, { text: string; border: string; dot: string }> = {
  applied: {
    text: "text-stage-new-fg",
    border: "border-stage-new-border",
    dot: "bg-stage-new-dot",
  },
  shortlisted: {
    text: "text-stage-shortlisted-fg",
    border: "border-stage-shortlisted-border",
    dot: "bg-stage-shortlisted-dot",
  },
  interviewing: {
    // `screening` palette was defined in design.md §3.1 even though it's unused
    // for the DB status enum — co-opted here for the derived interviewing stage.
    text: "text-stage-screening-fg",
    border: "border-stage-screening-border",
    dot: "bg-stage-screening-dot",
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
      {STAGE_LABEL[stage]}
    </span>
  );
}
