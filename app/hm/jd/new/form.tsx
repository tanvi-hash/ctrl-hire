"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChipList } from "@/components/ui/chip-list";
import { FieldHint, Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { JdTemplate, JdDraft } from "@/lib/hm-templates";

type Status = "editing" | "submitting" | "sent";

/**
 * HM-facing JD drafting form.
 * Frontend-only — `Submit` flips into a "sent to HR" success state that
 * renders a stub email preview. No DB writes, no real email.
 */
export function JdForm({ template }: { template: JdTemplate }) {
  const [status, setStatus] = useState<Status>("editing");
  const [draft, setDraft] = useState<JdDraft>(() => ({ ...template.draft }));

  const update = <K extends keyof JdDraft>(key: K, value: JdDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status !== "editing") return;
    setStatus("submitting");
    // Pretend-latency for the "sending to HR" feel, then flip to the success screen.
    await new Promise((r) => setTimeout(r, 650));
    setStatus("sent");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (status === "sent") {
    return <SentView draft={draft} />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card title="Role basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="title" required>
            <Input
              id="title"
              value={draft.title}
              onChange={(e) => update("title", e.target.value)}
              required
            />
          </Field>
          <Field label="Role family" htmlFor="role_family" required>
            <Input
              id="role_family"
              value={draft.role_family}
              onChange={(e) => update("role_family", e.target.value)}
              required
            />
          </Field>
          <Field label="Team" htmlFor="team">
            <Input id="team" value={draft.team} onChange={(e) => update("team", e.target.value)} />
          </Field>
          <Field label="Location" htmlFor="location">
            <Input
              id="location"
              value={draft.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </Field>
          <Field label="Compensation" htmlFor="compensation">
            <Input
              id="compensation"
              value={draft.compensation}
              onChange={(e) => update("compensation", e.target.value)}
              placeholder="e.g. ₹40–55L + equity"
            />
          </Field>
        </div>
      </Card>

      <Card title="About the role">
        <FieldHint>The opener. What this role owns and why it matters.</FieldHint>
        <Textarea
          rows={4}
          value={draft.about}
          onChange={(e) => update("about", e.target.value)}
        />
      </Card>

      <Card title="Responsibilities">
        <FieldHint>One bullet per responsibility — Enter to add.</FieldHint>
        <ChipList
          name="responsibilities"
          initialValue={draft.responsibilities}
          placeholder="Type a responsibility and press Enter"
          minItems={1}
        />
      </Card>

      <Card title="Qualifications">
        <div>
          <Label>Must-haves</Label>
          <FieldHint>Hard requirements HR will turn into ✓/✗ checks.</FieldHint>
          <ChipList
            name="must_haves"
            initialValue={draft.must_haves}
            placeholder="Type and press Enter"
            minItems={1}
          />
        </div>
        <div className="mt-4">
          <Label>Nice-to-haves</Label>
          <FieldHint>Preferred, not required.</FieldHint>
          <ChipList
            name="nice_to_haves"
            initialValue={draft.nice_to_haves}
            placeholder="Type and press Enter"
          />
        </div>
      </Card>

      <Card title="Benefits">
        <FieldHint>What makes this role great — perks, learning budget, offsites, etc.</FieldHint>
        <ChipList
          name="benefits"
          initialValue={draft.benefits}
          placeholder="Type and press Enter"
        />
      </Card>

      <Card title="About the team">
        <FieldHint>Brief — who they&apos;ll work with and how the team operates.</FieldHint>
        <Textarea
          rows={3}
          value={draft.team_intro}
          onChange={(e) => update("team_intro", e.target.value)}
        />
      </Card>

      <div className="flex items-center justify-between rounded-lg border border-line bg-card px-5 py-4 shadow-card">
        <div className="text-[12.5px] text-ink-soft">
          When you submit, HR gets an email and the JD appears in their pending-review queue.
        </div>
        <Button type="submit" variant="primary" disabled={status !== "editing"}>
          {status === "submitting" ? "Sending…" : "Send to HR"}
        </Button>
      </div>

      <div className="text-[11.5px] text-muted">
        <Link href="/hm" className="underline">
          Cancel
        </Link>{" "}
        and pick a different template.
      </div>
    </form>
  );
}

// ─── Primitives ──────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-card p-5 shadow-card">
      <h2 className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-1 text-stage-rejected-fg">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

// ─── Sent view ───────────────────────────────────────────────────────────────

function SentView({ draft }: { draft: JdDraft }) {
  const now = useMemo(
    () =>
      new Date().toLocaleString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        day: "numeric",
        month: "short",
      }),
    [],
  );

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-stage-shortlisted-border bg-stage-shortlisted-bg p-8 text-center shadow-card-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stage-shortlisted-dot text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
          </svg>
        </div>
        <h2 className="mt-4 font-serif text-[28px] leading-tight font-normal -tracking-[0.01em]">
          JD sent to HR
        </h2>
        <p className="mx-auto mt-1 max-w-prose text-[13.5px] text-stage-shortlisted-fg">
          An email just went out to HR. They&apos;ll review, extract the rubric, and publish the
          candidate application URL. You&apos;ll get a notification when it&apos;s live.
        </p>
      </section>

      <section className="rounded-lg border border-line bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"
              />
            </svg>
            Email preview
          </div>
          <span className="text-[11.5px] text-muted">Sent {now}</span>
        </div>
        <div className="grid gap-2 px-5 py-4 text-[13px]">
          <Row label="To">alex.rao@vymo.test</Row>
          <Row label="Cc">meera.subramaniam@vymo.test</Row>
          <Row label="From">ctrl-hire · no-reply@ctrl-hire.app</Row>
          <Row label="Subject">
            <span className="font-medium text-ink">New JD ready for review — {draft.title}</span>
          </Row>
          <div className="mt-3 space-y-2.5 border-t border-line pt-3 text-ink-soft">
            <p>Hi Alex,</p>
            <p>
              Meera has submitted a JD draft for <b className="text-ink">{draft.title}</b> (
              {draft.team}, {draft.location}). The role targets {draft.compensation} and calls out{" "}
              {draft.must_haves.length} must-haves and {draft.nice_to_haves.length} nice-to-haves.
            </p>
            <p>
              Open the tool to review the content, generate the rubric, and publish the candidate
              URL.
            </p>
            <p className="pt-1 text-[12.5px] text-muted">— ctrl-hire</p>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Link href="/hm">
          <Button variant="ghost">Back to templates</Button>
        </Link>
        <Link href="/hr">
          <Button variant="primary">See it as HR →</Button>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[70px_1fr] items-baseline gap-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className="text-ink">{children}</div>
    </div>
  );
}
