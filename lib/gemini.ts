import "server-only";

/**
 * Single-purpose Gemini client — scores a resume PDF against a rubric.
 * TRD §5.
 *
 * Uses the REST API directly to avoid a versioned SDK dependency for the
 * one call we make. Model: gemini-2.5-flash. Output is schema-constrained
 * via `responseSchema` + `responseMimeType: "application/json"`.
 */

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export interface Rubric {
  title: string;
  role_family: string;
  must_haves: string[];
  nice_to_haves: string[];
  focus_attributes: string[];
}

export interface CheckItem {
  requirement: string;
  met: boolean;
  evidence: string;
}

export interface ScoreProfile {
  current_company?: string | null;
  current_title?: string | null;
  location?: string | null;
  years_of_experience?: number | null;
  phone?: string | null;
}

export interface ScoreJSON {
  match_score: number;
  must_have_checks: CheckItem[];
  nice_to_have_checks: CheckItem[];
  strengths: string[];
  gaps: string[];
  summary: string;
  profile: ScoreProfile;
}

const SYSTEM_INSTRUCTION = `You are a careful, evidence-based technical recruiter. Score the attached resume against the rubric provided.
Ground every claim in specific evidence from the resume — do not invent experience.

Return JSON exactly matching the response schema:

- match_score: integer 0–100, weighted roughly 50% must-haves met, 20% nice-to-haves met, 30% semantic fit for the role family and focus attributes.
- must_have_checks and nice_to_have_checks: exactly one entry per requirement in the rubric, using the requirement text verbatim. For each, set met=true with one short sentence of evidence drawn from the resume, OR met=false with one short sentence explaining why.
- strengths: exactly 3 short, specific strengths grounded in the resume.
- gaps: exactly 3 short, specific gaps or concerns.
- summary: exactly one sentence capturing the candidate's overall profile.
- profile: optional facts extracted verbatim from the resume when clearly present. OMIT a field if not clearly stated — never guess, never hallucinate.
  - current_company: the candidate's most recent employer name
  - current_title: the candidate's most recent job title
  - location: city / country as written on the resume
  - years_of_experience: integer — sum of professional FTE years; omit if ambiguous
  - phone: phone number as written; include any country code

If the resume is ambiguous or evidence is absent, mark requirements as met=false with a clear reason. Do not hallucinate.`;

// Gemini accepts a subset of OpenAPI 3.0 schema (types UPPERCASE).
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    match_score: { type: "INTEGER", minimum: 0, maximum: 100 },
    must_have_checks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          requirement: { type: "STRING" },
          met: { type: "BOOLEAN" },
          evidence: { type: "STRING" },
        },
        required: ["requirement", "met", "evidence"],
      },
    },
    nice_to_have_checks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          requirement: { type: "STRING" },
          met: { type: "BOOLEAN" },
          evidence: { type: "STRING" },
        },
        required: ["requirement", "met", "evidence"],
      },
    },
    strengths: { type: "ARRAY", items: { type: "STRING" }, minItems: 3, maxItems: 3 },
    gaps: { type: "ARRAY", items: { type: "STRING" }, minItems: 3, maxItems: 3 },
    summary: { type: "STRING" },
    profile: {
      type: "OBJECT",
      properties: {
        current_company: { type: "STRING", nullable: true },
        current_title: { type: "STRING", nullable: true },
        location: { type: "STRING", nullable: true },
        years_of_experience: { type: "INTEGER", nullable: true, minimum: 0, maximum: 60 },
        phone: { type: "STRING", nullable: true },
      },
    },
  },
  required: ["match_score", "must_have_checks", "nice_to_have_checks", "strengths", "gaps", "summary"],
};

function rubricText(r: Rubric): string {
  const bullets = (xs: string[]) => xs.length ? xs.map((x) => `- ${x}`).join("\n") : "(none)";
  return [
    `Role: ${r.title}`,
    `Role family: ${r.role_family}`,
    ``,
    `Must-haves:`,
    bullets(r.must_haves),
    ``,
    `Nice-to-haves:`,
    bullets(r.nice_to_haves),
    ``,
    `Focus attributes (weighted into semantic fit):`,
    bullets(r.focus_attributes),
    ``,
    `Resume PDF is attached.`,
  ].join("\n");
}

export async function scoreResume(input: {
  rubric: Rubric;
  resumePdf: ArrayBuffer | Uint8Array;
}): Promise<ScoreJSON> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const bytes =
    input.resumePdf instanceof Uint8Array
      ? input.resumePdf
      : new Uint8Array(input.resumePdf);
  const pdfBase64 = Buffer.from(bytes).toString("base64");

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [
      {
        role: "user",
        parts: [
          { text: rubricText(input.rubric) },
          { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    },
  };

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }

  return validateScore(parsed);
}

// ─── Shape validation ─────────────────────────────────────────────────────────
// Gemini's schema is best-effort; defensively validate before persisting.

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

function validateScore(raw: unknown): ScoreJSON {
  if (!raw || typeof raw !== "object") throw new Error("Score is not an object.");
  const r = raw as Record<string, unknown>;

  const match_score = Math.round(Number(r.match_score));
  if (!Number.isFinite(match_score) || match_score < 0 || match_score > 100)
    throw new Error("match_score out of range.");

  const must_have_checks = asChecks(r.must_have_checks, "must_have_checks");
  const nice_to_have_checks = asChecks(r.nice_to_have_checks, "nice_to_have_checks");
  const strengths = asStringArr(r.strengths, "strengths");
  const gaps = asStringArr(r.gaps, "gaps");
  const summary = typeof r.summary === "string" ? r.summary.trim() : "";

  if (!summary) throw new Error("summary is empty.");
  if (strengths.length !== 3) throw new Error("strengths must have 3 items.");
  if (gaps.length !== 3) throw new Error("gaps must have 3 items.");

  const profile = asProfile(r.profile);

  return { match_score, must_have_checks, nice_to_have_checks, strengths, gaps, summary, profile };
}

function asProfile(v: unknown): ScoreProfile {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const o = v as Record<string, unknown>;
  const pickStr = (k: string): string | undefined => {
    const val = o[k];
    if (typeof val !== "string") return undefined;
    const t = val.trim();
    return t.length > 0 ? t : undefined;
  };
  const yoeRaw = o.years_of_experience;
  const years_of_experience =
    typeof yoeRaw === "number" && Number.isFinite(yoeRaw) && yoeRaw >= 0 && yoeRaw < 70
      ? Math.round(yoeRaw)
      : undefined;
  const out: ScoreProfile = {};
  const cc = pickStr("current_company"); if (cc) out.current_company = cc;
  const ct = pickStr("current_title"); if (ct) out.current_title = ct;
  const loc = pickStr("location"); if (loc) out.location = loc;
  if (years_of_experience !== undefined) out.years_of_experience = years_of_experience;
  const ph = pickStr("phone"); if (ph) out.phone = ph;
  return out;
}

function asChecks(v: unknown, name: string): CheckItem[] {
  if (!Array.isArray(v)) throw new Error(`${name} is not an array.`);
  return v.map((item, i) => {
    if (!item || typeof item !== "object") throw new Error(`${name}[${i}] is not an object.`);
    const o = item as Record<string, unknown>;
    const requirement = typeof o.requirement === "string" ? o.requirement : "";
    const met = typeof o.met === "boolean" ? o.met : false;
    const evidence = typeof o.evidence === "string" ? o.evidence : "";
    if (!requirement || !evidence) throw new Error(`${name}[${i}] missing fields.`);
    return { requirement, met, evidence };
  });
}

function asStringArr(v: unknown, name: string): string[] {
  if (!Array.isArray(v)) throw new Error(`${name} is not an array.`);
  return v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((x): x is string => x.length > 0);
}
