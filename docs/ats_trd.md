# Internal ATS — TRD

**Status:** Draft v1  |  **Companion to:** `ATS_PRD.md` v2  |  **Updated:** 2026-04-23

---

## 1. Overview

Single web app, single database, one LLM provider. Everything runs inside one deployable. Scope is the MVP in the PRD: Rubric Setup (6.1), Shortlist Engine (6.2), Interviewer Workspace (6.3). Anything not in the PRD MVP is also not in this TRD.

---

## 2. Architecture

```
Candidate browser  ─┐
                    ├──▶  Next.js app (local → Vercel)  ──▶  Supabase (Postgres + Storage)
HR / Interviewer  ──┘                │
                                     └──▶  Gemini API (Google AI Studio)  — scoring
```

One Next.js app hosts all three views (candidate, HR, interviewer) under a single URL, routed by path. Supabase provides Postgres and file storage in one managed service. One outbound dependency: the Gemini API. Build locally first; push to Vercel when demo-ready.

No queues, no workers, no microservices, no cache layer, no event bus. Scoring is a synchronous LLM call triggered on application submit.

---

## 3. Stack


| Layer          | Pick                                                     | Why                                                                                      |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Web            | Next.js (App Router) + Tailwind                          | One codebase for frontend + API routes; deploys to Vercel with zero config               |
| DB + Storage   | Supabase (Postgres + Storage)                            | Both in one managed service with a generous free tier; Supabase JS client handles both   |
| Hosting        | Local dev → Vercel                                       | Ship to the default `*.vercel.app` URL; custom domain deferred                           |
| LLM            | Gemini 2.5 Flash via Google AI Studio                    | Free tier covers hackathon use; structured output via `responseSchema`; native PDF input |
| Resume parsing | Pass PDFs directly to Gemini (native multimodal support) | Avoids a separate parsing pipeline                                                       |
| Auth           | None for MVP                                             | All routes open; role implied by path. SSO is v1.1                                       |


---

## 4. Data model

```
Interviewer   (id, name, email)
Req           (id, title, role_family, must_haves: text[], nice_to_haves: text[],
               focus_attributes: text[], created_at)
Application   (id, req_id, candidate_name, candidate_email, resume_storage_path,
               submitted_at, status: new|shortlisted|rejected|saved)
Score         (id, application_id, match_score: int, must_have_checks: jsonb,
               nice_to_have_checks: jsonb, strengths: text[], gaps: text[],
               summary: text, scored_at)
InterviewAssignment  (id, application_id, interviewer_id, round_label: text,
                      created_at)
Scorecard     (id, assignment_id, ratings: jsonb, notes: text,
               recommendation: strong_hire|hire|no_hire|strong_no_hire,
               submitted_at)
```

Notes:

- `Interviewer` is a seeded directory — the only table tied to a person. HR and Candidate don't need rows in MVP.
- Rubric fields live directly on `Req`. If versioning is needed later, split into a `Rubric` table then.
- `resume_storage_path` is a Supabase Storage path (e.g., `resumes/{application_id}.pdf`); signed URLs are minted on demand.
- `Score` is 1:1 with `Application`. Absence of a `Score` row = "not scored yet" (shown in UI with a Retry button).
- `ratings` on `Scorecard` is `{focus_attribute: bars_score}` — shape matches the req's focus attributes.

---

## 5. AI scoring

**Trigger:** candidate submits application → create `Application` row → synchronously call Gemini → write `Score` row → return success. End-to-end target: <10s.

**Model:** Gemini 2.5 Flash.

**Prompt structure:**

1. System instruction — role + scoring instructions + output schema.
2. Rubric block — must-haves, nice-to-haves, focus attributes for this req.
3. Resume — PDF attached as inline file data.

Context caching (Gemini's equivalent of prompt caching) is an optimization for later — skip it for MVP. The free tier makes per-call cost a non-issue at hackathon scale.

**Output schema (enforced via `responseSchema` + `responseMimeType: "application/json"`):**

```json
{
  "match_score": 0-100,
  "must_have_checks": [{"requirement": "...", "met": true/false, "evidence": "..."}],
  "nice_to_have_checks": [{"requirement": "...", "met": true/false, "evidence": "..."}],
  "strengths": ["...", "...", "..."],
  "gaps": ["...", "...", "..."],
  "summary": "one sentence"
}
```

**Failure handling (MVP):** if the call fails, no `Score` row is written. The candidate shows up in HR's list as "Not scored" with a Retry button. No automatic retries.

---

## 6. Auth & access

**No auth in MVP.** All routes are open. Role is implied by URL path:

- `/apply/:req_slug` — candidate application (public)
- `/hr` — HR views
- `/interviewer?as=:interviewer_id` — interviewer picks themselves from a dropdown to see their queue

Access isolation (e.g., blind-until-submit for scorecards) is implemented as query filters so the UI behaves correctly, but it is **not** a security boundary in MVP — anyone who knows the URL can reach any view. Acceptable because this runs locally or on a non-production Vercel URL with synthetic data only.

---

## 7. API surface

Single host. Pages under the Next.js App Router; mutations via `/api/`* route handlers.

**Candidate:**

- `GET /apply/:req_slug` — application page
- `POST /api/apply/:req_slug` — multipart form; creates `Application`, uploads resume to Supabase Storage, kicks off scoring

**HR (`/hr/`*):**

- `GET /hr` — list reqs
- `POST /api/reqs` — create req + rubric
- `GET /hr/reqs/:id` — ranked candidate list
- `GET /api/applications/:id` — side panel payload (score + signed resume URL)
- `POST /api/applications/:id/action` — shortlist | reject | save_for_later
- `POST /api/applications/:id/assignments` — assign interviewer(s) + round label

**Interviewer (`/interviewer/`*):**

- `GET /interviewer?as=:interviewer_id` — queue for the selected interviewer
- `GET /interviewer/applications/:id` — briefing view (other scorecards hidden until this interviewer submits)
- `POST /api/scorecards` — submit scorecard for an assignment

That's the whole surface for MVP.

---

## 8. Key flows

**Application submit → scoring**

1. Candidate POSTs form to `/api/apply/:req_slug`.
2. Server validates, uploads resume to Supabase Storage, inserts `Application` row.
3. Server calls Gemini with system instruction + rubric + resume PDF.
4. Server inserts `Score` row.
5. Candidate sees confirmation.

**HR shortlist review**

1. HR opens `/hr/reqs/:id` → server returns applications joined with scores, ordered by `match_score DESC`.
2. HR clicks a candidate → side panel fetches full `Score` JSON + signed resume URL from Supabase Storage (10-min TTL).
3. HR clicks action → `Application.status` updated.

**Interview assignment & scorecard**

1. HR assigns interviewer(s) to a shortlisted `Application` with a round label.
2. Interviewer sees the candidate in their queue, opens briefing.
3. Interviewer submits scorecard → `Scorecard` row written.
4. Other interviewers' scorecards on the same `Application` become visible to this interviewer only after their own is submitted. The `Application` becomes eligible to advance only once all scorecards for the current round are in.

---

## 9. Deployment

**Local-first.** Build on `localhost:3000` against a Supabase cloud project. Push to Vercel only when the app is demo-ready.

- **Local setup:** `pnpm dev` for Next.js. Supabase project URL + anon key + service-role key in `.env.local`. Gemini API key in `.env.local`. That's all the config.
- **Vercel:** connect the Git repo, copy the same env vars into Vercel project settings, `git push` deploys. Use the default `*.vercel.app` URL — custom domain deferred.
- **Secrets:** Supabase service-role key and Google AI Studio API key are server-only (never `NEXT_PUBLIC_`*). Anon key is fine to expose client-side.
- **Migrations:** Supabase-managed. Keep schema SQL files in the repo (`supabase/migrations/`); apply via `supabase db push` or the dashboard.
- **Storage bucket:** one Supabase Storage bucket, e.g. `resumes`, private; served via signed URLs.

No CI/CD, no infra-as-code, no staging environment — explicitly out of scope for MVP. `git push main` → Vercel auto-deploys is enough.

---

## 10. Non-functional targets (MVP)


| Concern               | Target               |
| --------------------- | -------------------- |
| Scoring latency (p95) | <10s per application |
| Resume file size      | 5 MB cap             |


No SLOs, no alerting, no dashboards. Console logs are the MVP observability.

---

## 11. Explicitly out of scope (technical)

- Background workers / queues
- Retries, circuit breakers, fallback models
- Multi-tenant isolation
- Observability (metrics, traces, structured logs)
- Full-text search across candidates or resumes
- File scanning / virus checks on uploads
- Rate limiting on the candidate-facing endpoint
- Audit log / event history
- Data retention / right-to-be-forgotten workflows
- Email / notification delivery
- Any integration with Vymo's existing HRIS or Darwin Box
- Automated tests beyond a smoke script; no CI

All of these are reasonable v1.1+ concerns; none of them block the PRD MVP.

---

## 12. Open questions

- **Gemini free-tier data policy.** Google AI Studio's free tier may use prompts and responses for model improvement. Candidate resumes contain PII — acceptable for a synthetic-data demo; move to Vertex AI (training-use off) before any real candidate data flows through.
- **Gemini rate limits.** Free tier has per-minute and per-day caps — fine for demo, worth knowing if the team expects burst submissions.
- **Supabase free tier.** 500MB Postgres, 1GB storage, 5GB egress — enough for MVP. Confirm before loading heavy sample data.
- **Custom domain.** Deferred — we ship on `*.vercel.app` for now. Revisit when the tool moves beyond demo.

