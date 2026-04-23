import Link from "next/link";

export default function ApplyNotFound() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 pt-10 text-center">
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 text-[14px] font-semibold -tracking-[0.01em] text-ink-soft hover:text-ink"
      >
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-ink text-[11px] font-bold text-white">
          c
        </span>
        ctrl·hire
      </Link>
      <div className="mt-16 rounded-lg border border-line bg-card p-10 shadow-card-lg">
        <h1 className="font-serif text-[36px] leading-tight font-normal -tracking-[0.01em]">
          Role not found
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-[13.5px] text-ink-soft">
          This application link may have expired or the role may have been
          unpublished. Please check with the recruiter who shared it.
        </p>
      </div>
    </div>
  );
}
