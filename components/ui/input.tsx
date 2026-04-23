import { InputHTMLAttributes, LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-md border border-line bg-card px-3 py-2.5 text-[13.5px] text-ink outline-none transition-[border-color,box-shadow] duration-100 placeholder:text-muted",
          "focus:border-[var(--color-line-hover)] focus:ring-4 focus:ring-[var(--color-ring-focus)]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label
      {...props}
      className={cn(
        "block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted",
        className,
      )}
    >
      {children}
    </label>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 mb-2 text-[12px] text-ink-soft">{children}</p>;
}
