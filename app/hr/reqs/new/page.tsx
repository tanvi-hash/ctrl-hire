"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChipList } from "@/components/ui/chip-list";
import { FieldHint, Input, Label } from "@/components/ui/input";

export default function NewReqPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const readChips = (name: string): string[] => {
      const raw = String(data.get(name) ?? "[]");
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
      } catch {
        return [];
      }
    };

    const payload = {
      title: String(data.get("title") ?? "").trim(),
      role_family: String(data.get("role_family") ?? "").trim(),
      must_haves: readChips("must_haves"),
      nice_to_haves: readChips("nice_to_haves"),
      focus_attributes: readChips("focus_attributes"),
    };

    // Lightweight client-side validation to mirror server rules.
    if (payload.title.length < 3) return finish("Title must be at least 3 characters.");
    if (!payload.role_family) return finish("Role family is required.");
    if (payload.must_haves.length === 0) return finish("Add at least one must-have.");
    if (payload.focus_attributes.length === 0) return finish("Add at least one focus attribute.");

    try {
      const res = await fetch("/api/reqs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status}).`);
      }
      const { slug }: { slug: string } = await res.json();
      router.push(`/hr?published=${encodeURIComponent(slug)}`);
    } catch (err) {
      finish(err instanceof Error ? err.message : "Failed to create req.");
    }

    function finish(msg: string) {
      setError(msg);
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <header className="mb-6">
        <h1 className="text-[40px] leading-[1.05] font-normal -tracking-[0.01em] font-serif">
          New requisition
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-soft">
          Define the role and the rubric. Publishing generates the candidate
          application URL (PRD §6.3).
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-lg border border-line bg-card p-6 shadow-card-lg"
      >
        <div>
          <Label htmlFor="title">Title</Label>
          <FieldHint>Shown to candidates on the application page.</FieldHint>
          <Input
            id="title"
            name="title"
            required
            minLength={3}
            placeholder="Senior Frontend Engineer"
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor="role_family">Role family</Label>
          <FieldHint>Free text for MVP — e.g. Engineering, Design, Sales.</FieldHint>
          <Input
            id="role_family"
            name="role_family"
            required
            placeholder="Engineering"
            autoComplete="off"
          />
        </div>

        <div>
          <Label>Must-haves</Label>
          <FieldHint>
            Hard requirements — drive the must-have ✓/✗ in the shortlist side panel.
          </FieldHint>
          <ChipList name="must_haves" placeholder="Type a requirement and press Enter" minItems={1} />
        </div>

        <div>
          <Label>Nice-to-haves</Label>
          <FieldHint>Preferred, not required.</FieldHint>
          <ChipList name="nice_to_haves" placeholder="Type and press Enter" />
        </div>

        <div>
          <Label>Focus attributes</Label>
          <FieldHint>
            Competencies interviewers rate against in scorecards.
          </FieldHint>
          <ChipList name="focus_attributes" placeholder="Type and press Enter" minItems={1} />
        </div>

        {error && (
          <div className="rounded-md border border-stage-rejected-border bg-stage-rejected-bg px-3 py-2 text-[13px] text-stage-rejected-fg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <Link href="/hr">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </form>
    </div>
  );
}
