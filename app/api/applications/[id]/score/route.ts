import { NextResponse } from "next/server";
import { scoreApplication } from "@/lib/scoring";

export const maxDuration = 30;

/**
 * POST /api/applications/:id/score — retry Gemini scoring for an application.
 * Powers the "Retry" button in the HR list (TRD §5, issue #6).
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid application id." }, { status: 400 });
  }

  const result = await scoreApplication(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
