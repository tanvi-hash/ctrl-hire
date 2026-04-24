"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/input";

const MAX_BYTES = 5 * 1024 * 1024; // TRD §10

export function ApplyForm({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source") ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch(`/api/apply/${encodeURIComponent(slug)}`, {
        method: "POST",
        body: data,
      });
      if (!res.ok) {
        const body: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status}).`);
      }
      router.push(`/apply/${slug}?submitted=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 space-y-6 rounded-lg border border-line bg-card p-6 shadow-card-lg"
      noValidate
    >
      <input type="hidden" name="source" value={source} />

      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required placeholder="Priya Ramaswamy" autoComplete="name" />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="priya@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <Label htmlFor="resume">Resume</Label>
        <FieldHint>PDF, up to 5 MB.</FieldHint>
        <ResumeField />
      </div>

      {error && (
        <div className="rounded-md border border-stage-rejected-border bg-stage-rejected-bg px-3 py-2 text-[13px] text-stage-rejected-fg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end border-t border-line pt-4">
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Submitting…" : "Submit application"}
        </Button>
      </div>
    </form>
  );
}

function ResumeField() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function pick(f: File | null) {
    setLocalError(null);
    if (!f) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (f.type !== "application/pdf") {
      setLocalError("PDF only.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setLocalError("File is larger than 5 MB.");
      return;
    }
    setFile(f);
  }

  return (
    <div>
      <label
        htmlFor="resume"
        className="flex cursor-pointer items-center justify-between rounded-md border border-dashed border-line bg-card px-4 py-4 text-[13px] transition-[border-color,background-color] hover:border-[var(--color-line-hover)] hover:bg-hover-alt"
      >
        {file ? (
          <>
            <span className="flex items-center gap-2 text-ink">
              <DocIcon />
              <span className="truncate">{file.name}</span>
              <span className="text-muted">· {(file.size / 1024 / 1024).toFixed(1)} MB</span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                pick(null);
              }}
              className="text-[12px] text-muted hover:text-ink"
            >
              Change
            </button>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2 text-ink-soft">
              <UploadIcon />
              Click to upload your resume
            </span>
            <span className="text-[12px] text-muted">PDF · 5 MB max</span>
          </>
        )}
      </label>
      <input
        ref={inputRef}
        id="resume"
        name="resume"
        type="file"
        accept="application/pdf"
        required
        className="sr-only"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
      {localError && (
        <p className="mt-1 text-[12px] text-stage-rejected-fg">{localError}</p>
      )}
    </div>
  );
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path strokeLinecap="round" d="M9 13h6M9 17h4" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 3v12m0-12l-4 4m4-4l4 4" />
    </svg>
  );
}
