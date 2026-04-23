import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 5 * 1024 * 1024; // TRD §10
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/apply/:slug — candidate submits an application.
 * TRD §7, §8 (steps 1–2). Scoring (steps 3–4) hooks in at issue #5.
 * No auth — public endpoint (TRD §6).
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const resume = form.get("resume");

  if (name.length < 2)
    return NextResponse.json({ error: "Name is required." }, { status: 422 });
  if (!EMAIL_RE.test(email))
    return NextResponse.json({ error: "A valid email is required." }, { status: 422 });
  if (!(resume instanceof File) || resume.size === 0)
    return NextResponse.json({ error: "Resume file is required." }, { status: 422 });
  if (resume.type !== "application/pdf")
    return NextResponse.json({ error: "Resume must be a PDF." }, { status: 422 });
  if (resume.size > MAX_BYTES)
    return NextResponse.json({ error: "Resume must be 5 MB or less." }, { status: 422 });

  const supabase = createAdminClient();

  const { data: reqRow, error: reqErr } = await supabase
    .from("reqs")
    .select("id")
    .eq("slug", slug)
    .single<{ id: string }>();

  if (reqErr || !reqRow) {
    return NextResponse.json({ error: "Requisition not found." }, { status: 404 });
  }

  // Pre-mint the application id so the storage path and DB row share it
  // (TRD §4 note: "resumes/{application_id}.pdf").
  const applicationId = randomUUID();
  const storagePath = `${applicationId}.pdf`;

  const { error: uploadErr } = await supabase.storage
    .from("resumes")
    .upload(storagePath, resume, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadErr) {
    console.error("Resume upload failed:", uploadErr);
    return NextResponse.json({ error: "Couldn't upload resume." }, { status: 500 });
  }

  const { error: insertErr } = await supabase.from("applications").insert({
    id: applicationId,
    req_id: reqRow.id,
    candidate_name: name,
    candidate_email: email,
    resume_storage_path: storagePath,
    status: "new",
  });

  if (insertErr) {
    console.error("Application insert failed:", insertErr);
    // Best-effort cleanup so we don't leave an orphaned blob.
    await supabase.storage
      .from("resumes")
      .remove([storagePath])
      .catch((e) => console.error("Orphan cleanup failed:", e));
    return NextResponse.json({ error: "Couldn't save your application." }, { status: 500 });
  }

  // Scoring hook-in lands at issue #5; no-op for now.
  return NextResponse.json({ ok: true, applicationId });
}
