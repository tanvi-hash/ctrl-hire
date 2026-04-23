import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/interviewers — the seeded interviewer directory.
 * Powers the assignment picker in the HR side panel (issue #7).
 */
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interviewers")
    .select("id, name, email")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ interviewers: data ?? [] });
}
