import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full rounded-md border border-line bg-card px-3 py-2.5 text-[13.5px] leading-[1.55] text-ink outline-none transition-[border-color,box-shadow] duration-100 placeholder:text-muted",
        "focus:border-[var(--color-line-hover)] focus:ring-4 focus:ring-[var(--color-ring-focus)]",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
