import Link from "next/link";
import { JD_TEMPLATES, type JdTemplate } from "@/lib/hm-templates";

export default function HMLandingPage() {
  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-stage-saved-bg px-2.5 py-1 text-[11.5px] font-medium text-stage-saved-fg">
          <span className="h-1.5 w-1.5 rounded-full bg-stage-saved-dot" />
          Hiring Manager
        </div>
        <h1 className="mt-3 font-serif text-[40px] leading-[1.05] font-normal -tracking-[0.01em]">
          Start a new <span className="italic text-ink-soft">job description</span>
        </h1>
        <p className="mt-2 max-w-prose text-[13.5px] text-ink-soft">
          Pick a template below. Edit it to match the role. Send it to HR — they&apos;ll extract
          the rubric and publish the candidate application URL.
        </p>
      </header>

      <ul className="flex flex-col gap-4">
        {JD_TEMPLATES.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </ul>

      <section className="mt-10 rounded-lg border border-dashed border-line bg-card/60 p-6">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
          Your drafts
        </div>
        <p className="mt-2 text-[13px] text-ink-soft">
          No drafts yet. JDs you start will show up here so you can come back to them.
        </p>
      </section>
    </div>
  );
}

const ACCENT: Record<JdTemplate["accent"], { kicker: string; dot: string }> = {
  eng: { kicker: "Engineering", dot: "bg-stage-screening-dot" },
  design: { kicker: "Design", dot: "bg-stage-saved-dot" },
  sales: { kicker: "Sales", dot: "bg-stage-shortlisted-dot" },
};

function TemplateCard({ template }: { template: JdTemplate }) {
  const a = ACCENT[template.accent];
  const preview = truncate(template.draft.about, 180);
  const { responsibilities, must_haves, nice_to_haves } = template.draft;

  return (
    <li>
      <Link
        href={`/hm/jd/new?template=${template.id}`}
        className="group block rounded-lg border border-line bg-card p-6 shadow-card transition-[transform,border-color] hover:-translate-y-px hover:border-[var(--color-line-hover)]"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
              {a.kicker}
            </div>
            <h2 className="mt-2 text-[22px] font-semibold -tracking-[0.01em]">{template.title}</h2>
            <p className="mt-1 text-[13px] text-ink-soft">{template.subtitle}</p>
            <p className="mt-4 max-w-prose text-[13.5px] leading-[1.55] text-ink-soft">
              {preview}
            </p>
          </div>

          <span className="shrink-0 self-start text-[12.5px] font-medium text-ink-soft transition-colors group-hover:text-ink">
            Use template →
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-4 text-[12px] text-muted">
          <Stat n={responsibilities.length} label="responsibilities" />
          <Stat n={must_haves.length} label="must-haves" />
          <Stat n={nice_to_haves.length} label="nice-to-haves" />
          <Stat n={template.draft.benefits.length} label="benefits" />
        </div>
      </Link>
    </li>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span>
      <span className="font-semibold tabular-nums text-ink-soft">{n}</span>{" "}
      <span>{label}</span>
    </span>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice) + "…";
}
