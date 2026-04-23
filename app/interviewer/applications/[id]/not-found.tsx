import Link from "next/link";

export default function BriefingNotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <h1 className="font-serif text-[32px] leading-tight font-normal -tracking-[0.01em]">
        Briefing not found
      </h1>
      <p className="mx-auto mt-2 max-w-prose text-[13.5px] text-ink-soft">
        You aren&apos;t assigned to this candidate — or the candidate no longer exists.
      </p>
      <Link
        href="/interviewer"
        className="mt-5 inline-block text-[13px] font-medium text-ink-soft underline hover:text-ink"
      >
        ← Back to interviewer queue
      </Link>
    </div>
  );
}
