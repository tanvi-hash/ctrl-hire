/**
 * Filled applicant-source pill — design.md §5.9.
 * Known channels get their palette; unknown tags fall back to the career palette.
 */

const KNOWN: Record<string, { fg: string; bg: string; label: string }> = {
  referral: {
    fg: "text-source-referral-fg",
    bg: "bg-source-referral-bg",
    label: "Referral",
  },
  linkedin: {
    fg: "text-source-linkedin-fg",
    bg: "bg-source-linkedin-bg",
    label: "LinkedIn",
  },
  naukri: {
    fg: "text-source-naukri-fg",
    bg: "bg-source-naukri-bg",
    label: "Naukri",
  },
  career: {
    fg: "text-source-career-fg",
    bg: "bg-source-career-bg",
    label: "Career page",
  },
};

export function SourcePill({ source }: { source: string }) {
  const key = source.toLowerCase();
  const style = KNOWN[key] ?? {
    fg: "text-source-career-fg",
    bg: "bg-source-career-bg",
    label: source,
  };
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium ${style.fg} ${style.bg}`}
    >
      {style.label}
    </span>
  );
}
