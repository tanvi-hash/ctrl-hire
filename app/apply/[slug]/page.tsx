import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplyForm } from "./form";

interface ReqHead {
  id: string;
  slug: string;
  title: string;
  role_family: string;
}

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: req, error } = await supabase
    .from("reqs")
    .select("id, slug, title, role_family")
    .eq("slug", slug)
    .single<ReqHead>();

  if (error || !req) notFound();

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 pb-20 pt-10">
      <BrandMark />

      {sp.submitted ? (
        <Confirmation title={req.title} />
      ) : (
        <>
          <RoleHeader req={req} />
          <ApplyForm slug={req.slug} />
        </>
      )}
    </div>
  );
}

function BrandMark() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 text-[14px] font-semibold -tracking-[0.01em] text-ink-soft hover:text-ink"
    >
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-ink text-[11px] font-bold text-white">
        c
      </span>
      ctrl·hire
    </Link>
  );
}

function RoleHeader({ req }: { req: ReqHead }) {
  return (
    <section className="mt-8 rounded-lg border border-line bg-card p-6 shadow-card-lg">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-stage-shortlisted-bg px-2.5 py-1 text-[11.5px] font-medium text-stage-shortlisted-fg">
        <span className="h-1.5 w-1.5 rounded-full bg-stage-shortlisted-dot" />
        Applying
      </div>
      <h1 className="mt-3 font-serif text-[40px] leading-[1.05] font-normal -tracking-[0.01em]">
        {req.title}
      </h1>
      <div className="mt-1 text-[13.5px] text-ink-soft">{req.role_family}</div>
    </section>
  );
}

function Confirmation({ title }: { title: string }) {
  return (
    <section className="mt-8 rounded-lg border border-stage-shortlisted-border bg-stage-shortlisted-bg p-10 text-center shadow-card-lg">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stage-shortlisted-dot text-white">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
        </svg>
      </div>
      <h1 className="mt-4 font-serif text-[32px] leading-tight font-normal -tracking-[0.01em]">
        Application received
      </h1>
      <p className="mx-auto mt-2 max-w-prose text-[13.5px] text-ink-soft">
        Thanks for applying to <b className="text-ink">{title}</b>. We&apos;ll be in touch within a few days.
      </p>
    </section>
  );
}
