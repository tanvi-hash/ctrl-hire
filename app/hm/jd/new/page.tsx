import Link from "next/link";
import { findTemplate, JD_TEMPLATES } from "@/lib/hm-templates";
import { JdForm } from "./form";

export default async function NewJdPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  const tpl = findTemplate(template) ?? JD_TEMPLATES[0];

  return (
    <div className="max-w-3xl">
      <Link
        href="/hm"
        className="mb-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-soft hover:text-ink"
      >
        ← Back to templates
      </Link>

      <header className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-line-2 px-2.5 py-1 text-[11.5px] font-medium text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-stage-saved-dot" />
          Using template · <b className="text-ink">{tpl.title}</b>
        </div>
        <h1 className="mt-2 font-serif text-[40px] leading-[1.05] font-normal -tracking-[0.01em]">
          Draft the <span className="italic text-ink-soft">job description</span>
        </h1>
        <p className="mt-2 max-w-prose text-[13.5px] text-ink-soft">
          The fields below are pre-filled from the template. Tune anything that doesn&apos;t fit
          the role, then send to HR. HR will extract the rubric and publish the candidate URL.
        </p>
      </header>

      <JdForm template={tpl} />
    </div>
  );
}
