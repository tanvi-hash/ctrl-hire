import Link from "next/link";
import { Nav } from "@/components/nav";

export default function Home() {
  return (
    <div className="mx-auto max-w-[var(--container-shell)] px-6 py-5">
      <Nav />
      <main className="mt-16 max-w-4xl pb-16">
        <h1 className="text-[56px] leading-[1.02] font-normal -tracking-[0.01em] font-serif">
          ctrl<span className="text-ink-soft">·</span>hire
        </h1>
        <p className="mt-3 max-w-prose text-[14px] text-ink-soft">
          Internal ATS — the screen-to-interview core of hiring. Pick a view:
        </p>

        <ul className="mt-8 flex flex-col gap-4">
          <RoleCard
            href="/hm"
            kicker="Internal · v1.1"
            title="Hiring Manager"
            blurb="Draft a JD from a curated template and hand it off to HR for review."
            highlights={["3 role-family templates", "Edit-in-place", "One-click send to HR"]}
          />
          <RoleCard
            href="/hr"
            kicker="Internal"
            title="HR"
            blurb="Review reqs, confirm shortlists from AI-ranked candidates, and assign interviewers."
            highlights={["Ranked shortlist", "Side-panel deep-dive", "Interviewer assignment"]}
          />
          <RoleCard
            href="/interviewer"
            kicker="Internal"
            title="Interviewer"
            blurb="Pick yourself, see your queue, run briefings, and submit structured scorecards."
            highlights={["Per-candidate briefing", "BARS scorecard", "Blind until submit"]}
          />
        </ul>
      </main>
    </div>
  );
}

function RoleCard({
  href,
  kicker,
  title,
  blurb,
  highlights,
}: {
  href: string;
  kicker: string;
  title: string;
  blurb: string;
  highlights: string[];
}) {
  return (
    <li>
      <Link
        href={href}
        className="group block rounded-lg border border-line bg-card p-6 shadow-card transition-[border-color,transform] hover:-translate-y-px hover:border-[var(--color-line-hover)]"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
              {kicker}
            </div>
            <div className="mt-2 text-[26px] font-semibold -tracking-[0.01em]">{title}</div>
            <p className="mt-1.5 max-w-prose text-[13.5px] leading-[1.55] text-ink-soft">
              {blurb}
            </p>
          </div>
          <span className="shrink-0 self-start text-[12.5px] font-medium text-ink-soft transition-colors group-hover:text-ink">
            Open →
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-4 text-[12px] text-muted">
          {highlights.map((h) => (
            <span key={h}>· {h}</span>
          ))}
        </div>
      </Link>
    </li>
  );
}
