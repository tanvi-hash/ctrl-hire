import Link from "next/link";
import { Nav } from "@/components/nav";

export default function Home() {
  return (
    <div className="mx-auto max-w-[var(--container-shell)] px-6 py-5">
      <Nav />
      <main className="mt-16 max-w-3xl">
        <h1 className="text-[56px] leading-[1.02] font-normal -tracking-[0.01em] font-serif">
          ctrl<span className="text-ink-soft">·</span>hire
        </h1>
        <p className="mt-3 text-[14px] text-ink-soft">
          Internal ATS — the screen-to-interview core of hiring. Pick a view:
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <RoleCard
            href="/hr"
            kicker="Internal"
            title="HR"
            blurb="Create reqs · review shortlists · assign interviewers."
          />
          <RoleCard
            href="/interviewer"
            kicker="Internal"
            title="Interviewer"
            blurb="Queue · briefing · structured scorecards."
          />
        </div>
      </main>
    </div>
  );
}

function RoleCard({
  href,
  kicker,
  title,
  blurb,
}: {
  href: string;
  kicker: string;
  title: string;
  blurb: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-line bg-card p-5 shadow-card transition-[border-color,transform] hover:-translate-y-px hover:border-[var(--color-line-hover)]"
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
        {kicker}
      </div>
      <div className="mt-1 text-[20px] font-semibold -tracking-[0.01em]">{title}</div>
      <div className="mt-2 text-[13px] text-ink-soft">{blurb}</div>
    </Link>
  );
}
