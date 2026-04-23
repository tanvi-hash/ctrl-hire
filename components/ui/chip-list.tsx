"use client";

import { KeyboardEvent, useState } from "react";

interface ChipListProps {
  /** Name of the hidden input. The submitted value is a JSON-encoded string[]. */
  name: string;
  initialValue?: string[];
  placeholder?: string;
  /** Minimum number of chips — used for visual cue only; real validation is server-side. */
  minItems?: number;
}

export function ChipList({
  name,
  initialValue = [],
  placeholder = "Type and press Enter",
  minItems,
}: ChipListProps) {
  const [items, setItems] = useState<string[]>(initialValue);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim();
    if (v && !items.includes(v)) setItems([...items, v]);
    setDraft("");
  };

  const remove = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && items.length) {
      setItems(items.slice(0, -1));
    }
  };

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      <div
        className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-md border border-line bg-card p-2 transition-colors focus-within:border-[var(--color-line-hover)]"
      >
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-line-2 px-3 py-1 text-[13px] text-ink-soft"
          >
            {item}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove ${item}`}
              className="inline-flex rounded-full p-0.5 text-muted hover:bg-line hover:text-ink"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={items.length === 0 ? placeholder : ""}
          className="min-w-[140px] flex-1 bg-transparent px-1 text-[13.5px] text-ink outline-none placeholder:text-muted"
        />
      </div>
      {minItems !== undefined && items.length < minItems && (
        <p className="mt-1 text-[11px] text-muted">
          {items.length === 0
            ? `Add at least ${minItems}.`
            : `Add ${minItems - items.length} more.`}
        </p>
      )}
    </div>
  );
}
