/**
 * URL-safe slug from a title. Lowercase, ASCII words, hyphen-joined.
 *
 * slugify("Senior Frontend Engineer") === "senior-frontend-engineer"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Pick a slug that doesn't collide with any in `existing`.
 * Appends `-2`, `-3`, … until a free variant is found.
 */
export function uniqueSlug(base: string, existing: readonly string[]): string {
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
