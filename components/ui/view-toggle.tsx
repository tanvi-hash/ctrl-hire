"use client";

/** Card / List toggle pill — matches the stage-filter visual language. */
export function ViewToggle({
  view,
  onChange,
}: {
  view: "card" | "list";
  onChange: (v: "card" | "list") => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-card p-1">
      <Opt active={view === "card"} onClick={() => onChange("card")} label="Card">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3" y="4" width="18" height="7" rx="1.5" />
          <rect x="3" y="13" width="18" height="7" rx="1.5" />
        </svg>
      </Opt>
      <Opt active={view === "list"} onClick={() => onChange("list")} label="List">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </Opt>
    </div>
  );
}

function Opt({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
        active ? "bg-ink text-white" : "text-ink-soft hover:bg-line-2"
      }`}
    >
      {children}
      {label}
    </button>
  );
}
