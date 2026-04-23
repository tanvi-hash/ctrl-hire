import Link from "next/link";

export default function ReqNotFound() {
  return (
    <div className="mx-auto max-w-2xl py-20 text-center">
      <h1 className="font-serif text-[36px] leading-tight font-normal -tracking-[0.01em]">
        Requisition not found
      </h1>
      <p className="mx-auto mt-3 max-w-prose text-[13.5px] text-ink-soft">
        This req may have been deleted or the link may be stale.
      </p>
      <Link
        href="/hr"
        className="mt-6 inline-block text-[13px] font-medium text-ink-soft underline hover:text-ink"
      >
        ← Back to reqs
      </Link>
    </div>
  );
}
