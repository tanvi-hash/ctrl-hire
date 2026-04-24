import Link from "next/link";
import { JD_TEMPLATES, type JdTemplate } from "@/lib/hm-templates";

export default function HMLandingPage() {
  return (
    <div className="max-w-5xl">
      <header className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-stage-saved-bg px-2.5 py-1 text-[11.5px] font-medium text-stage-saved-fg">
          <span className="h-1.5 w-1.5 rounded-full bg-stage-saved-dot" />
          Hiring Manager
        </div>
        <h1 className="mt-2 font-serif text-[40px] leading-[1.05] font-normal -tracking-[0.01em]">
          Start a new <span className="italic text-ink-soft">job description</span>
        </h1>
        <p className="mt-2 max-w-prose text-[13.5px] text-ink-soft">
          Pick a template below. Edit it to match the role. Send it to HR — they&apos;ll extract
          the rubric and publish the candidate application URL.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {JD_TEMPLATES.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>

      <section className="mt-8 rounded-lg border border-dashed border-line bg-card/60 p-5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
          Your drafts
        </div>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          No drafts yet. JDs you start will show up here so you can come back to them.
        </p>
      </section>
    </div>
  );
}

const ACCENT: Record<JdTemplate["accent"], { kicker: string; border: string; dot: string }> = {
  eng: {
    kicker: "Engineering",
    border: "border-stage-screening-border",
    dot: "bg-stage-screening-dot",
  },
  design: {
    kicker: "Design",
    border: "border-stage-saved-border",
    dot: "bg-stage-saved-dot",
  },
  sales: {
    kicker: "Sales",
    border: "border-stage-shortlisted-border",
    dot: "bg-stage-shortlisted-dot",
  },
};

function TemplateCard({ template }: { template: JdTemplate }) {
  const a = ACCENT[template.accent];
  return (
    <Link
      href={`/hm/jd/new?template=${template.id}`}
      className={`group relative block overflow-hidden rounded-md border ${a.border} bg-card p-5 shadow-card transition-[transform,border-color] hover:-translate-y-px hover:border-[var(--color-line-hover)]`}
    >
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
        <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
        {a.kicker}
      </div>
      <h2 className="mt-2 text-[18px] font-semibold -tracking-[0.01em]">{template.title}</h2>
      <p className="mt-1 text-[12.5px] text-ink-soft">{template.subtitle}</p>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11.5px] text-muted">
        <span>
          {template.draft.responsibilities.length} responsibilities ·{" "}
          {template.draft.must_haves.length} must-haves
        </span>
        <span className="font-medium text-ink-soft transition-colors group-hover:text-ink">
          Use template →
        </span>
      </div>
    </Link>
  );
}
