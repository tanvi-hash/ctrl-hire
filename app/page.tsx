export default function Home() {
  return (
    <main className="mx-auto max-w-[var(--container-shell)] px-6 pt-20 pb-16">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-stage-shortlisted-bg px-2.5 py-1 text-[length:var(--text-ui-11-5)] font-medium text-stage-shortlisted-fg">
        <span className="h-1.5 w-1.5 rounded-full bg-stage-shortlisted-dot" />
        Scaffold online
      </div>
      <h1 className="display-serif text-[length:var(--text-ui-40)] leading-tight">
        ctrl-hire
      </h1>
      <p className="mt-2 max-w-prose text-ink-soft">
        Internal ATS · screen-to-interview core of hiring. Next.js + Tailwind v4 +
        Supabase scaffold is wired up. Build out the HR, Candidate and Interviewer
        surfaces next (PRD §6.1–6.3).
      </p>

      <section className="mt-10 grid gap-3 md:grid-cols-3">
        <TokenTile label="Ink" swatch="bg-ink" />
        <TokenTile label="Card" swatch="bg-card border border-line" />
        <TokenTile label="Line" swatch="bg-line" />
      </section>
    </main>
  );
}

function TokenTile({ label, swatch }: { label: string; swatch: string }) {
  return (
    <div className="rounded-md border border-line bg-card p-4 shadow-[var(--shadow-card)]">
      <div className={`h-10 w-full rounded-sm ${swatch}`} />
      <div className="mt-2 text-[length:var(--text-ui-12)] text-muted">{label}</div>
    </div>
  );
}
