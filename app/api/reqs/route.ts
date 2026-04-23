import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify, uniqueSlug } from "@/lib/slug";

interface CreateReqPayload {
  title?: unknown;
  role_family?: unknown;
  must_haves?: unknown;
  nice_to_haves?: unknown;
  focus_attributes?: unknown;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
}

/**
 * POST /api/reqs — create a requisition with its rubric.
 * TRD §7, PRD §6.3. No auth (TRD §6).
 */
export async function POST(req: NextRequest) {
  let payload: CreateReqPayload;
  try {
    payload = (await req.json()) as CreateReqPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const roleFamily = typeof payload.role_family === "string" ? payload.role_family.trim() : "";
  const mustHaves = asStringArray(payload.must_haves);
  const niceToHaves = asStringArray(payload.nice_to_haves);
  const focusAttributes = asStringArray(payload.focus_attributes);

  if (title.length < 3)
    return NextResponse.json({ error: "Title must be at least 3 characters." }, { status: 422 });
  if (!roleFamily)
    return NextResponse.json({ error: "Role family is required." }, { status: 422 });
  if (mustHaves.length === 0)
    return NextResponse.json({ error: "At least one must-have is required." }, { status: 422 });
  if (focusAttributes.length === 0)
    return NextResponse.json({ error: "At least one focus attribute is required." }, { status: 422 });

  const base = slugify(title);
  if (!base)
    return NextResponse.json({ error: "Title must contain word characters." }, { status: 422 });

  const supabase = await createClient();

  const { data: existing, error: lookupError } = await supabase
    .from("reqs")
    .select("slug")
    .like("slug", `${base}%`);
  if (lookupError) {
    console.error("Slug lookup failed:", lookupError);
    return NextResponse.json({ error: "Failed to create req." }, { status: 500 });
  }

  const slug = uniqueSlug(
    base,
    (existing ?? []).map((r: { slug: string }) => r.slug),
  );

  const { data, error } = await supabase
    .from("reqs")
    .insert({
      slug,
      title,
      role_family: roleFamily,
      must_haves: mustHaves,
      nice_to_haves: niceToHaves,
      focus_attributes: focusAttributes,
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("Create req failed:", error);
    return NextResponse.json({ error: "Failed to create req." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, slug: data.slug }, { status: 201 });
}
