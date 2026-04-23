/**
 * Row action trio — approve / save / reject — design.md §5.13.
 * Each button's hover state picks up the destination stage's palette,
 * previewing what will happen (design.md §6.1).
 */

export type ActionKind = "shortlist" | "saved" | "rejected";

interface RowActionsProps {
  onAction: (kind: ActionKind) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function RowActions({ onAction, disabled, size = "md" }: RowActionsProps) {
  const s =
    size === "sm"
      ? "h-7 w-7 rounded-[8px] [&>svg]:h-[13px] [&>svg]:w-[13px]"
      : "h-8 w-8 rounded-[10px] [&>svg]:h-[14px] [&>svg]:w-[14px]";
  return (
    <div className="flex items-center gap-1.5">
      <IconBtn
        className={`${s} hover:bg-stage-shortlisted-bg hover:text-stage-shortlisted-fg hover:border-stage-shortlisted-border`}
        title="Approve (shortlist)"
        onClick={(e) => {
          e.stopPropagation();
          onAction("shortlist");
        }}
        disabled={disabled}
      >
        <CheckIcon />
      </IconBtn>
      <IconBtn
        className={`${s} hover:bg-stage-saved-bg hover:text-stage-saved-fg hover:border-stage-saved-border`}
        title="Save for later"
        onClick={(e) => {
          e.stopPropagation();
          onAction("saved");
        }}
        disabled={disabled}
      >
        <BookmarkIcon />
      </IconBtn>
      <IconBtn
        className={`${s} hover:bg-stage-rejected-bg hover:text-stage-rejected-fg hover:border-stage-rejected-border`}
        title="Reject"
        onClick={(e) => {
          e.stopPropagation();
          onAction("rejected");
        }}
        disabled={disabled}
      >
        <XIcon />
      </IconBtn>
    </div>
  );
}

function IconBtn({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`flex items-center justify-center border border-line bg-card text-ink-soft transition-[background-color,border-color,color] disabled:pointer-events-none disabled:opacity-50 ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-4-7 4V5z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
