"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Top glass nav — design.md §5.1.
 * Breadcrumb path is derived from the pathname.
 */
export function Nav() {
  const pathname = usePathname();
  const path = computePath(pathname);

  return (
    <nav className="flex items-center gap-4 rounded-full border border-[var(--color-glass-90)] bg-[var(--color-glass-70)] px-4 py-[10px] shadow-nav backdrop-blur-[14px]">
      <Link href="/" className="flex items-center gap-2.5 text-[14px] font-semibold -tracking-[0.01em]">
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-ink text-white text-[11px] font-bold">
          c
        </span>
        ctrl·hire
      </Link>
      {path && <div className="text-[13px] text-muted">{path}</div>}
      <div className="flex-1" />
      <div className="flex items-center gap-2.5 text-[13px] font-medium">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white text-[11px] font-semibold">
          AR
        </div>
        <span>Alex R.</span>
      </div>
    </nav>
  );
}

function computePath(pathname: string): string | null {
  if (pathname === "/" || pathname === "") return null;
  if (pathname === "/hr") return "Reqs";
  if (pathname === "/hr/reqs/new") return (
    // Rendered as a plain string with middle-dot to match nav typographic density.
    "Reqs / New"
  );
  if (pathname.startsWith("/hr/reqs/")) return "Reqs / " + pathname.split("/")[3];
  if (pathname.startsWith("/interviewer")) return "Interviewer";
  if (pathname.startsWith("/apply/")) return "Apply";
  return null;
}
