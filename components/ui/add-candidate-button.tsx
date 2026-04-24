"use client";

/**
 * Icon-only ink-filled button that expands on hover to reveal a user-plus
 * icon + "Add candidates" label. Pattern from the design exploration.
 *
 * Wire `onClick` from parent for the modal / route of choice.
 */
export function AddCandidateButton({ onClick, title = "Add candidates" }: { onClick?: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="group relative inline-flex h-[38px] w-[38px] items-center justify-center gap-0 overflow-hidden whitespace-nowrap rounded-full bg-ink px-0 text-white transition-[width,padding,gap,background-color] duration-[250ms] ease-[var(--ease-panel)] hover:w-[160px] hover:gap-2 hover:bg-[var(--color-ink-hover)] hover:px-3"
    >
      <svg
        className="h-4 w-4 shrink-0 transition-opacity duration-150 group-hover:hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
      </svg>
      <svg
        className="hidden h-4 w-4 shrink-0 group-hover:inline-block"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6"
        />
      </svg>
      <span className="hidden text-[13px] font-medium group-hover:inline-block">Add candidates</span>
    </button>
  );
}
