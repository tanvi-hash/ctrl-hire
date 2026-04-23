import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "subtle" | "danger-ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  // design.md §5.17
  primary:
    "bg-ink text-white border-transparent hover:bg-[var(--color-ink-hover)]",
  ghost:
    "bg-card text-ink border-line hover:border-[var(--color-line-hover)] hover:bg-hover-alt",
  subtle:
    "bg-transparent text-ink-soft border-transparent hover:bg-line-2",
  "danger-ghost":
    "bg-card text-ink border-line hover:text-stage-rejected-fg hover:border-stage-rejected-border hover:bg-stage-rejected-bg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "ghost", className, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center gap-[7px] rounded-full border px-[14px] py-[9px] text-[13px] font-medium transition-[transform,background-color,border-color,color] duration-100 hover:-translate-y-px disabled:pointer-events-none disabled:opacity-60",
          variantStyles[variant],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
