"use client";

import { useEffect, useState } from "react";

/**
 * View-JD dialog — a right-side overlay that shows the req's rubric
 * (must-haves, nice-to-haves, focus attributes). The "JD" in MVP is the
 * rubric HR typed when creating the req (PRD §6.3). Since there's no
 * separate document, this presents the structured rubric as the JD.
 *
 * Visually aligned with the candidate-detail side panel: slides from the
 * right, scrim backdrop, Escape / backdrop click to close.
 */
export function ViewJdButton({
  title,
  role_family,
  slug,
  must_haves,
  nice_to_haves,
  focus_attributes,
}: {
  title: string;
  role_family: string;
  slug: string;
  must_haves: string[];
  nice_to_haves: string[];
  focus_attributes: string[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-[12px] font-medium text-ink-soft transition-[border-color,color] hover:border-[var(--color-line-hover)] hover:text-ink"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"
          />
          <path strokeLinecap="round" d="M9 13h6M9 17h4" />
        </svg>
        View JD
      </button>

      <div
        role="presentation"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[99] bg-[var(--color-backdrop)] backdrop-blur-[3px] transition-opacity duration-200 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[100] flex w-[var(--container-side)] max-w-[95vw] flex-col border-l border-line bg-card shadow-side transition-transform duration-[320ms] ease-[var(--ease-panel)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-[10px] border border-line bg-card text-ink-soft hover:bg-line-2 hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>

        <div className="overflow-y-auto">
          <div className="border-b border-line p-6 pb-4">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-muted">
              Job description
            </div>
            <h2 className="mt-1 font-serif text-[28px] leading-[1.1] font-normal -tracking-[0.01em]">
              {title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-ink-soft">
              <span>{role_family}</span>
              <span>·</span>
              <code className="rounded-full bg-line-2 px-2.5 py-0.5 font-mono text-[11.5px]">
                /apply/{slug}
              </code>
            </div>
          </div>

          <div className="p-6 pt-4">
            <RubricBlock title={`Must-haves · ${must_haves.length}`} items={must_haves} />
            <RubricBlock title={`Nice-to-haves · ${nice_to_haves.length}`} items={nice_to_haves} />
            <RubricBlock title={`Focus attributes · ${focus_attributes.length}`} items={focus_attributes} />
          </div>
        </div>
      </aside>
    </>
  );
}

function RubricBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border-b border-line py-4 last:border-b-0">
      <h3 className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="text-[12.5px] text-muted">(none)</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((it, i) => (
            <li key={`${i}-${it}`} className="rounded-md bg-line-2 px-3 py-2 text-[13px] text-ink">
              {it}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
