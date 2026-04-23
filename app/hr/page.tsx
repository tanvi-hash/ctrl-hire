import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

interface ReqListItem {
  id: string;
  slug: string;
  title: string;
  role_family: string;
  created_at: string;
}

export default async function HRLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: reqs, error } = await supabase
    .from("reqs")
    .select("id, slug, title, role_family, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl">
      {params.published && <PublishedBanner slug={params.published} />}

      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] leading-[1.05] font-normal -tracking-[0.01em] font-serif">
            Open reqs
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-soft">
            Reqs you&apos;ve created. Each has its own candidate application URL.
          </p>
        </div>
        <Link href="/hr/reqs/new">
          <Button variant="primary">
            <PlusIcon />
            New requisition
          </Button>
        </Link>
      </header>

      {error ? (
        <ErrorCard message={error.message} />
      ) : !reqs || reqs.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {reqs.map((req) => (
            <ReqCard key={req.id} req={req} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PublishedBanner({ slug }: { slug: string }) {
  const url = `/apply/${slug}`;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-stage-shortlisted-border bg-stage-shortlisted-bg px-4 py-3 text-[13px]">
      <span className="font-medium text-stage-shortlisted-fg">Published.</span>
      <span className="text-ink-soft">Candidate URL:</span>
      <code className="rounded bg-card px-2 py-0.5 font-mono text-[12.5px] text-ink">{url}</code>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-line bg-card/70 p-12 text-center">
      <p className="text-[13.5px] text-ink-soft">No reqs yet. Create your first one to get started.</p>
      <div className="mt-4 flex justify-center">
        <Link href="/hr/reqs/new">
          <Button variant="primary">
            <PlusIcon />
            New requisition
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-stage-rejected-border bg-stage-rejected-bg px-4 py-3 text-[13px]">
      <div className="font-medium text-stage-rejected-fg">Couldn&apos;t load reqs.</div>
      <div className="mt-0.5 text-ink-soft">{message}</div>
      <div className="mt-2 text-[12px] text-muted">
        Check Supabase env vars in <code className="font-mono">.env.local</code> and that the schema migration has been applied.
      </div>
    </div>
  );
}

function ReqCard({ req }: { req: ReqListItem }) {
  return (
    <li className="rounded-md border border-line bg-card p-5 shadow-card transition-[border-color,transform] hover:-translate-y-px hover:border-[var(--color-line-hover)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold -tracking-[0.01em] text-ink">{req.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
            <span>{req.role_family}</span>
            <span>·</span>
            <span>Created {formatDate(req.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <code className="rounded-full bg-line-2 px-3 py-1 font-mono text-[12px] text-ink-soft">
            /apply/{req.slug}
          </code>
          <Link
            href={`/hr/reqs/${req.id}`}
            className="text-[12.5px] font-medium text-ink-soft hover:text-ink"
          >
            Open →
          </Link>
        </div>
      </div>
    </li>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}
