# In-house ATS — Technical Requirements Document (TRD)

**Status:** Draft v1  |  **Companion to:** `docs/prd.md`, `docs/research.md`  |  **Scope:** 1.5-day hackathon MVP + the 2 weeks of polish after it

---

## How to read this document

Every section follows the same shape: **what we're building**, **how we'll build it**, and **why** (the rationale — written for someone who doesn't write code day-to-day). If you only read the "Why" paragraphs, you will still understand the system.

A short glossary of terms used throughout:

- **Frontend** — the screens people click on in a browser.
- **Backend** — the code that lives on a server, reads and writes the database, runs AI calls, and enforces rules. In our design the frontend and backend live in one Next.js project.
- **Database** — a structured filing cabinet for our data (users, jobs, applications, scorecards). We use Postgres.
- **Embedding** — a long list of numbers that represents the "meaning" of a piece of text. Two resumes with similar content will have similar numbers, even if the wording differs. Used for semantic similarity scoring.
- **pgvector** — a Postgres extension that can store and compare embeddings inside the database, so we don't need a separate vector service.
- **LLM** — Large Language Model (Claude, GPT, etc). We use it for scoring resumes, extracting JD rubrics, and drafting summaries.
- **Rubric** — the structured "what good looks like" for a job: must-haves, nice-to-haves, and focus attributes.
- **BARS** — Behaviorally Anchored Rating Scale. Instead of "rate 1–5," each number has a written description of what behavior earns that rating. Reduces interviewer drift.
- **Monorepo** — one repository with multiple related projects inside it (the web app, shared UI kit, shared database code).

---

## 1. Goals and non-goals for this TRD

### Goals

- Pin down the shape of the system clearly enough that a small team can build the MVP in 1.5 days without arguing about architecture.
- Make the product invariants from the PRD (blind-until-submit, role-scoping, AI-is-advisory) enforceable in code — not just documented.
- Choose boring, fast tools so we spend the hackathon on product, not plumbing.

### Non-goals

- Not a spec for v1.1 integrations (LinkedIn Apply, Naukri, Darwin Box push). Called out where relevant, but not designed here.
- Not a security / SOC2 plan. MVP uses stubbed auth per PRD §7. Real auth is v1.1.
- Not a DEI analytics plan. v1.1.

---

## 2. System overview

### 2.1 The shape of the system

```
                    Public web (no login)
                    ─────────────────────
                       /apply/:reqId
                            │
                            ▼
    ┌───────────────────────────────────────────────────┐
    │                  Next.js app                      │
    │  ┌─────────────────────────────────────────────┐  │
    │  │ React pages (HR / HM / Interviewer / Public) │  │
    │  └─────────────────────────────────────────────┘  │
    │  ┌─────────────────────────────────────────────┐  │
    │  │ Server actions & route handlers              │  │
    │  │  - auth (stubbed role cookie for MVP)         │  │
    │  │  - role-scoped queries                        │  │
    │  │  - state machine (stage advancement)          │  │
    │  │  - AI orchestration (parse, rubric, score)    │  │
    │  └─────────────────────────────────────────────┘  │
    └───────────────────┬───────────────────────────────┘
                        │
                ┌───────┼────────────┐
                ▼       ▼            ▼
           Supabase  Supabase     Anthropic + OpenAI
           Postgres   Storage     (LLM + embeddings)
          (+ pgvector) (resumes)
```

Everything user-facing lives inside one Next.js project. The Next.js server is also the backend — it talks directly to Postgres, to Supabase Storage for resume files, and to the LLM providers.

### 2.2 Why one app instead of a separate frontend + backend

The research doc offered a split stack (Next.js + FastAPI in Python). We're not taking that option for MVP.

- **Speed.** One codebase, one language (TypeScript), one deploy. No cross-service contracts to keep in sync during a 1.5-day sprint.
- **Types on both sides.** The same TypeScript type describes a `Scorecard` on the form, in the API handler, and in the database. One less category of bug.
- **Next.js already has a backend.** Server Actions and Route Handlers run the same way FastAPI endpoints would. We don't need a second server.
- **Python ecosystem for AI is a red herring at this scale.** The heavy AI work (embeddings, LLMs) happens in hosted services via HTTP. TypeScript calls them just as easily as Python.

If later we need Python-specific ML libraries, we can add a small FastAPI service behind the Next.js app. We don't need it now.

### 2.3 Hosting

- **Web app:** Vercel. Owned by the team that makes Next.js, zero-config.
- **Database + file storage + auth (future):** Supabase. Postgres, `pgvector` extension, file storage, and a future auth story all in one dashboard. Generous free tier.
- **LLMs:** Anthropic (Claude Haiku for scoring + drafting) and OpenAI (`text-embedding-3-small` for embeddings). Both pay-as-you-go; the hackathon budget is dollars, not hundreds of dollars.

**Why this combination:** every piece has a free tier that covers demo traffic, and each is the default / most boring choice in its category. We don't want to spend day-one debugging infrastructure.

---

## 3. Monorepo layout

```
ctrl-hire/
├─ apps/
│  └─ web/                 Next.js 14 (App Router) — the only app for MVP
├─ packages/
│  ├─ react/               Shared UI components (shadcn-based)
│  ├─ db/                  DB schema, migrations, typed query client
│  ├─ ai/                  Prompts, scoring pipeline, embeddings client
│  └─ types/               Zod schemas + shared TypeScript types
├─ docs/
├─ CLAUDE.md
├─ turbo.json
└─ package.json            Yarn workspaces root
```

### Why a monorepo

The PRD has four user surfaces (candidate, HR, HM, interviewer) that all share the same data model. If each surface lived in its own repo, we'd duplicate types, duplicate validation, and accidentally let them drift apart. One repo with clearly-separated packages is the standard fix.

### Why these specific packages

- `apps/web` — the only deployable thing in MVP. Everything ultimately ships through here.
- `packages/react` — reusable UI (candidate card, BARS rating, scorecard form). Kept separate so Storybook can render them in isolation, which speeds up UI review without needing the whole app running. (Also the reason `.claude/settings.json` already permits writes to `packages/react/**`.)
- `packages/db` — one source of truth for table definitions and the typed query helpers. If the `applications` table gains a column, exactly one file changes.
- `packages/ai` — all prompts and AI orchestration in one place so we can tune them without hunting through UI code.
- `packages/types` — shared Zod validation schemas. Same `ScorecardSchema` validates the form on the client and the incoming payload on the server.

### Tooling

- **Yarn workspaces** manages dependencies across packages.
- **Turborepo** runs build / test / lint commands with caching so the second run of `yarn build` is near-instant if nothing changed.
- **TypeScript** everywhere. Strict mode on from day one — cheaper to fix a type error than a runtime bug.
- **Vitest** for unit tests, **Playwright** for a single end-to-end "golden path" smoke test.
- **ESLint + Prettier** with defaults.
- **Storybook** for `packages/react` (if time permits — deferred if it slips).

---

## 4. Data model

Nine tables. The shapes below are the MVP minimum — columns will grow, but the relationships will not change.

```
users (id, email, name, role)                         role ∈ {hr, hm, interviewer}
role_templates (id, name, family, body_json)
requisitions (id, title, hm_user_id → users,
              template_id → role_templates,
              status, jd_markdown,
              must_haves, nice_to_haves, focus_attributes,   (all JSON)
              qualifying_questions,                           (JSON)
              approved_by → users, approved_at, published_at)
application_links (id, req_id → requisitions, source_tag)
applications (id, req_id → requisitions, link_id → application_links,
              candidate_name, candidate_email, resume_file_key,
              resume_text, parsed_resume,                  (JSON)
              qualifying_answers,                          (JSON)
              source_tag, status,
              must_have_score, nice_to_have_score,
              semantic_score, match_score,
              strengths, gaps, summary,                    (JSON / text)
              embedding vector(1536),
              created_at)
interviews (id, application_id → applications, round_index,
            round_name, focus_attributes,                  (JSON)
            scheduled_at)
interview_assignments (interview_id → interviews, interviewer_user_id → users)
scorecards (id, interview_id → interviews, interviewer_user_id → users,
            ratings, evidence,                             (JSON)
            overall,                                        (strong_hire | hire | no_hire | strong_no_hire)
            probes_for_next_round,                         (JSON)
            submitted_at nullable)
debrief_decisions (id, application_id → applications,
                   outcome, notes, decided_by → users, decided_at)
```

### 4.1 Why a relational database (not a document store)

Our data is inherently relational: a scorecard belongs to an interview, which belongs to an application, which belongs to a requisition, which belongs to a hiring manager. Every query we write ("show me all shortlisted candidates for reqs owned by HM X") crosses table boundaries. Postgres does this natively and indexes the joins well. A document store would force us to de-normalize and then fight it when we need to aggregate.

### 4.2 Why JSON columns for some fields

`must_haves`, `ratings`, `parsed_resume`, `qualifying_answers` are variable-shape — different JDs have different must-haves, different interviewers rate different attributes. Putting them in JSON columns instead of exploded child tables keeps the schema compact without losing the ability to query into them (Postgres supports JSON indexes).

For the MVP we validate the shape of this JSON on the way in with Zod (see §5), so it's not the "wild west" that JSON-blob columns usually become.

### 4.3 Why embeddings sit on the application row

The alternative is a separate `embeddings` table keyed by application id. That's one more join on the single hottest query in the app (the ranked shortlist). Keeping it on the row is faster and simpler, and pgvector supports an index directly on the column.

### 4.4 ORM choice: Drizzle

We use **Drizzle** (a TypeScript query builder that gives us type-safe SQL without the heavyweight feel of Prisma). It runs migrations, generates types from the schema, and produces queries that look like SQL — which matters because Postgres-specific features (pgvector, JSON operators) are easier in Drizzle than in Prisma.

Why this matters to you: fewer surprises in production. The types we see in the editor match the columns we have in the database.

---

## 5. Validation layer (`packages/types`)

Every piece of data that crosses a trust boundary — a form submit, an API call, an LLM response — is validated with a **Zod schema** before we touch it.

Example, conceptually:

```
ScorecardSchema = {
  interview_id: uuid,
  ratings: record(focus_attribute, integer 1..4),
  evidence: record(focus_attribute, string min 10 chars),
  overall: enum("strong_hire", "hire", "no_hire", "strong_no_hire"),
  probes_for_next_round: array(string),
}
```

### Why we do this

- **The PRD's "no neutral option" rule is an enum with 4 values.** If someone tries to submit "maybe," the server rejects it before it reaches the database. This rule lives in the Zod schema — one place.
- **LLMs hallucinate.** When we ask Claude to return a rubric as JSON, we validate its answer against a Zod schema. If it returns garbage, we catch it and retry, not three hours later when a weird value crashed a page.
- **Forms and APIs share the schema.** The React form uses `ScorecardSchema` to show field-level errors; the server action uses the same schema to reject bad input. We cannot accidentally let them disagree.

---

## 6. Authentication & authorization

### 6.1 MVP authentication: stubbed

Per PRD §7, MVP ships with **stubbed auth — a role dropdown on the landing page**. Picking "HR / Alex" sets a signed cookie with `{ user_id, role }`. Every server request reads that cookie.

Why stubbed: real auth (SSO, SAML) is a week of work and adds zero product value to the hackathon demo. We design the app as if auth were real (every page checks the cookie, every query filters by user) so swapping in SSO later is a mechanical change, not a rewrite.

### 6.2 Role-scoped queries (enforced at the data layer)

This is the single most important rule in the codebase. **Role scoping happens in the database query, not in the UI.**

- `HR` — no filter. Sees everything.
- `HM` — every `requisitions` read filters `hm_user_id = currentUser.id`. Every `applications` read joins through requisitions.
- `Interviewer` — every `applications` read filters to ones where they have a matching row in `interview_assignments`.

We implement this with a single function `scopedDb(user)` that returns a wrapped database client. Every handler uses `scopedDb(user)` instead of the raw client. The raw client is exported from a file that nothing outside `packages/db` imports. If you forget, code review catches it; if you still forget, the default queries don't return extra rows because the wrapper is the default.

**Why at the data layer:** filtering in the UI is the #1 cause of data leaks in applications of this size. An HM who opens their browser dev tools should not be able to see a req they don't own by tweaking a URL parameter. The API says "no" before the UI has a chance to render anything.

### 6.3 Blind-until-submit (scorecard visibility)

The rule: an interviewer cannot see any other scorecard for the same interview round until their own scorecard for that round is `submitted_at IS NOT NULL`.

Implementation: a helper `canViewOtherScorecards(userId, applicationId, roundIndex)` runs before any scorecard read. It answers true only if the requester has submitted their scorecard for the same round. HR bypasses this (they need to see everything to manage the pipeline); HMs see only after the round is complete.

A unit test covers every role combination. If someone adds a new endpoint that returns scorecards, the same helper must gate it — we don't re-implement the check ad-hoc.

### 6.4 Stage advancement state machine

A candidate's `status` column is a state machine, not a free-text field. Transitions live in one file:

```
applied  →  screened  →  shortlisted  →  round_1  →  round_2  →  ...  →  debrief  →  hired / rejected
```

Every transition runs a guard:

- `round_N → round_N+1` requires **all** scorecards for round N to be `submitted`.
- `round_final → debrief` requires all final-round scorecards to be submitted **and** unanimous Strong Hire / Hire. Mixed recs route to "Debrief Required"; all No Hire / Strong No Hire routes to "Recommend Reject." (PRD §6.5.)
- `debrief → hired` requires a `debrief_decisions.outcome = 'hire'` row.

**Why a state machine:** the PRD's advancement rules are not optional and not polite. If we leave `status` as a free-form string that any page can `UPDATE`, someone will eventually write code that skips the scorecard check. Centralizing transitions means every advancement path runs the same gates.

---

## 7. AI pipeline

Three AI surfaces: resume parsing, JD rubric extraction, application scoring. Each has a distinct trigger and a distinct prompt.

### 7.1 Resume parsing (on upload)

1. Candidate uploads a PDF/DOCX.
2. Server extracts raw text with `pdf-parse` (for PDFs) or `mammoth` (for DOCX).
3. Raw text → Claude Haiku with a "structured extraction" prompt → returns JSON (`name`, `email`, `phone`, `education[]`, `experience[]`, `skills[]`).
4. Validated with Zod. Stored on `applications.parsed_resume` and used to pre-fill the rest of the form.
5. Raw text also stored on `applications.resume_text` for later embedding + scoring.

**Why this two-step split:** `pdf-parse` is free and instant but produces messy text. The LLM turns that messy text into structured fields. We don't pay the LLM to do text extraction (it's bad at it) and we don't ask the parser to do structuring (it can't).

Fallback: if the LLM fails to return valid JSON twice, we save the raw text only and let the candidate fill fields manually. The application still goes through.

### 7.2 JD rubric extraction (on publish)

When HR approves a JD, publishing triggers:

1. JD markdown → Claude Haiku with a "rubric extraction" prompt → returns JSON (`must_haves[]`, `nice_to_haves[]`, `focus_attributes[]`, `suggested_qualifying_questions[]`).
2. Validated with Zod. Stored on the `requisitions` row.
3. Unique application URLs generated per channel (one row per `application_links`).
4. JD text is also embedded once and the embedding cached — used later as the reference vector for semantic matching.

**Why LLM-extract at publish, not at match time:** extracting the rubric is slow (seconds). If we did it every time we scored a candidate, the shortlist page would crawl. Doing it once at publish is fast at match time — we only compare pre-extracted structured fields.

### 7.3 Application scoring (on application submit)

On insert of a new `applications` row, we trigger scoring. Sequential steps:

1. **Hard knockouts first** — work authorization, location, minimum years-of-experience — evaluated from qualifying_answers against the JD's knockout rules. If a candidate fails, we store them with `status = 'rejected_knockout'` and skip scoring. (Research §scoring is explicit that knockouts run before, not inside, the score.)
2. **Embedding** — resume text → OpenAI `text-embedding-3-small` → 1536-dim vector stored in `applications.embedding`. Cosine-compared to the cached JD embedding gives `semantic_score` (0–1).
3. **Structured scoring** — Haiku receives (resume_text, must_haves, nice_to_haves) with a prompt asking it to return `{ must_have_match, nice_to_have_match, top_strengths[3], gaps[3], summary }`. Validated with Zod.
4. **Final score** — `match_score = 0.5 * must_have_match + 0.2 * nice_to_have_match + 0.3 * semantic_score`. (Weights from research §scoring.) Stored.
5. Candidate becomes visible to HR in the ranked shortlist.

**Why these specific weights:** the research doc documents them as the starting weights. They're tunable after we have real data. Hardcoding them today is fine; we'll expose a config later.

**Why AI never auto-rejects:** steps 2–4 only compute numbers and text. The candidate's `status` stays `screened`. Only HR clicking "Reject" (or passing a hard knockout) moves status. This is the PRD's most important AI invariant and it is visible in the code: no scoring function ever writes to `status`.

**Where scoring runs:** synchronously inside the server action for MVP. If a single resume takes >15 seconds, we move it to a background job (Vercel `waitUntil`). We're not setting up a full job queue for the hackathon.

### 7.4 Prompt management

All prompts live as named exports in `packages/ai/prompts/`. Each prompt is versioned (`resume-extract.v1.ts`, `rubric.v1.ts`). When we tweak a prompt, we bump the version — and we can A/B test versions later.

Why: prompts are code. Treating them like code (versioned, diffable, reviewable in PRs) prevents "the scoring started acting weird on Tuesday" mysteries.

### 7.5 Cost control

Every LLM call logs `{prompt_version, model, input_tokens, output_tokens, cost_usd}` to a `ai_calls` table. We set a daily cap and refuse calls past it. For a hackathon demo this avoids the classic "one infinite loop burned $200 overnight" scenario.

---

## 8. The frontend

Next.js App Router. Four user surfaces, each a top-level route segment:

```
/apply/[reqId]          public — candidate hosted application page
/hr                     HR dashboard + shortlist review + JD approval
/hm                     HM dashboard + shortlist approval + JD authoring
/interview              Interviewer briefings + scorecards
/ (landing)             Role switcher (MVP stubbed auth)
```

### 8.1 Rendering strategy

- **Read-heavy pages (ranked shortlist, briefing page):** React Server Components. Rendered on the server with a single DB round-trip and shipped as HTML + hydration. Fast first paint and no loading spinner waterfall.
- **Interactive forms (scorecard, JD edit, application form):** Client components with **server actions** for submission. Zod schema shared with the server. Optimistic updates where it matters (marking a candidate shortlisted).
- **Lists with client-side filter/sort** (shortlist filtering by source, score range): TanStack Query on the client, hydrated from the server render so first paint still shows data.

**Why this mix:** the default is server rendering (fast, SEO-friendly, one less thing to wire up). We reach for client components only where interactivity demands it. This is the Next.js App Router sweet spot.

### 8.2 UI kit

- **shadcn/ui** components installed into `packages/react/`. Not a library import — we copy the components into our repo and own them. Needed when we want to customize heavily (the BARS rating component, the candidate side panel).
- **Tailwind CSS** for styling. Utility classes only; no hand-rolled CSS files.
- **Design tokens** generated via `yarn tokens` (script TBD — likely `style-dictionary` driven from a JSON source). Hooked up so color / spacing changes roll out repo-wide.

**Why shadcn and not Material / Chakra / Ant:** the PRD has specific UI patterns (side panel over list for candidate detail, BARS ratings, blind-until-submit badge). Pre-built libraries force their own conventions; shadcn gives us accessible primitives we can bend without fighting.

### 8.3 Candidate detail side panel (PRD §6.3)

The PRD is specific that clicking a candidate opens a side panel over the ranked list — not a full-page navigation. We implement this with a shadcn `Sheet` component that overlays the right half of the screen. The URL updates (`/hr/reqs/abc?candidate=xyz`) so deep links work and the back button closes the panel. The list underneath stays scrolled to the same candidate.

**Why this matters:** HR's workflow is triage. Every full-page reload is a lost second and a lost position in the list. The side panel is cheap to build correctly and expensive to retrofit.

### 8.4 Storybook

`packages/react` components get Storybook stories. Stories double as visual regression fixtures (Chromatic or Playwright snapshots).

**Why:** the BARS rating, candidate card, and scorecard form are each rendered in a dozen places. If we only ever see them inside the full app, small visual bugs hide for weeks.

---

## 9. Key user flows mapped to code

### 9.1 Candidate applies

1. `GET /apply/:reqId?source=linkedin` — server fetches req (public, no auth), renders application form with JD-specific qualifying questions.
2. Candidate uploads resume → server action parses it, returns pre-filled fields.
3. Candidate edits, submits → server action:
   - creates `applications` row with `source_tag` from URL
   - kicks off scoring pipeline (§7.3)
   - returns confirmation page
4. Source tag is stored **once on insert** and never overwritten. Every later step reads it from the row, not from the URL.

### 9.2 HM authors a JD

1. HM lands on `/hm/reqs/new` → picks a template (`role_templates` list).
2. Template pre-fills JD editor (rich text, shared component). HM edits.
3. HM clicks "Submit to HR" → req status goes `draft → pending_review`. HR is notified (MVP: just shows up on their dashboard).
4. HR reviews on `/hr/reqs/:id/review` → clicks "Approve & Publish" → server action runs JD rubric extraction (§7.2), flips status to `open`, generates application links.
5. HR sees links in a modal, copies one per channel.

### 9.3 HR reviews the shortlist

1. HR lands on `/hr/reqs/:id` → server component renders ranked list sorted by `match_score` desc.
2. Each row shows: match score, top 3 strengths, top 3 gaps, source tag, resume preview button.
3. HR clicks a candidate → side panel opens (§8.3).
4. HR clicks "Shortlist" → server action transitions `applied → shortlisted`. Nothing else moves.
5. Shortlist completes → HR clicks "Send to HM" → notification appears on HM dashboard.

### 9.4 Interviewer runs a round

1. Interviewer lands on `/interview` → server component returns only their assignments (§6.2 scoping).
2. Clicks an assignment → briefing page shows resume, qualifying answers, focus attributes, and (if blind-until-submit gate permits) prior-round scorecards.
3. During / after interview, fills scorecard. Saves draft (writes scorecard row with `submitted_at = NULL`).
4. Submits → state machine runs (§6.4). If all scorecards for the round are now submitted, candidate advances.

### 9.5 Debrief

1. All final-round scorecards submitted → state machine transitions candidate to `debrief` and routes based on recs (PRD §6.5 table).
2. HM's dashboard shows the candidate under "Debrief required" / "Recommend reject" / "Suggested strongest."
3. HM opens debrief view → all scorecards side-by-side, avg rating, outlier flag (if any score diverges ≥ 2 levels from the mean).
4. HM / HR clicks a decision → writes `debrief_decisions` row → transitions candidate to `hired` or `rejected_final`.

---

## 10. Security model (MVP-sized)

- **Secrets:** all keys (Anthropic, OpenAI, Supabase service role) live in Vercel environment variables. Never committed. A hook in `.claude/settings.json` already blocks any Bash input matching `credentials|secret|password|api_key|apikey|token` — a simple belt-and-braces.
- **Resume files:** stored in Supabase Storage in a **private** bucket. Pages serve resumes via signed URLs that expire in 10 minutes. No direct public bucket access.
- **PII in logs:** we never log candidate names, emails, or resume text. We log IDs only.
- **Rate limiting:** public `/apply/:reqId` has a simple per-IP rate limit (via Vercel or Upstash). Prevents trivial resume-upload DoS.
- **LLM input sanitization:** resume text is passed to LLMs as a quoted block. We don't claim this is prompt-injection-proof, but we don't execute any output as commands, so the blast radius is limited to a malformed score.
- **CSRF:** Next.js server actions include CSRF protection by default.
- **SQL injection:** Drizzle parameterizes every query. We never hand-concatenate SQL.

What's out of scope for MVP: SSO, SOC2, row-level security policies in Postgres, audit logging. All v1.1.

---

## 11. Observability & failure handling

- **Errors:** Sentry (free tier) in the web app. Every server action wraps in an error boundary that reports to Sentry and returns a typed error to the client.
- **Logs:** Vercel logs + structured JSON (`{level, request_id, user_id, event}`). Every request gets a `request_id` for cross-referencing Sentry → logs → DB row.
- **AI call log:** `ai_calls` table (§7.5) doubles as an observability surface — "why did this score come back weird?" is a SQL query.
- **Health:** `/api/health` returns 200 if DB and Supabase are reachable. Vercel pings it; failed pings page the team (Slack webhook).

### Failure handling principles

- **LLM failure ≠ app failure.** If scoring fails, the application still saves — the candidate just shows as "scoring pending" until a retry succeeds.
- **Knockout mis-fires are logged prominently.** If the system rejects someone via knockout and HR overrides it, we log the override for later rule-tuning.
- **No silent fallbacks.** If a resume fails to parse, the form shows "we couldn't auto-fill — please enter manually" — not a success screen with blank fields.

---

## 12. Testing strategy

The hackathon constraint forces discipline: we don't have time for 100% coverage, so we test the things that would be catastrophic if wrong.

### Unit tests (Vitest)

Mandatory coverage for:

- Zod schemas (one passing + one failing case each).
- `canViewOtherScorecards` — blind-until-submit (§6.3).
- `scopedDb` — role scoping (§6.2).
- Stage advancement state machine — all guards (§6.4).
- Final score calculation — weights produce expected outputs.

### Integration tests

One test per user surface that walks a happy path through server actions with a real test database.

### End-to-end (Playwright)

One single test: candidate applies → HR shortlists → interviewer submits scorecard → HM sees debrief. If this test goes red, we stop and fix before shipping.

### What we don't test (at MVP)

- Visual regressions — covered informally via Storybook review.
- Load tests — demo traffic is <100 requests.
- Penetration tests — not in scope.

**Why this prioritization:** the four unit-test targets above encode the product invariants. If any of them breaks, the product is broken in a way that's easy to miss manually. Everything else can be found by clicking around before the demo.

---

## 13. Seed data and demo plan

Because the whole point of the hackathon is the demo, synthetic data is a feature, not a chore.

- `packages/db/seed.ts` populates: 3 users (one per role), 5 role templates, 2 published reqs, 1 draft req, 40 candidates across the two published reqs, 10 pre-submitted scorecards, 1 candidate at debrief.
- Synthetic resumes are generated by Claude from a list of role archetypes — varied quality, varied backgrounds, deliberate must-have matches and gaps.
- Source tags spread across `linkedin`, `naukri`, `referral`, `career-page` so dashboards aren't empty.

Running `yarn seed` resets to a known demo state. Used before every demo rehearsal.

---

## 14. Build / deploy commands

What we expect in `package.json` scripts once code lands (matches `.claude/settings.json`):

- `yarn dev` — runs Next.js dev server + watches `packages/react`
- `yarn build` — Turbo-run build across apps + packages
- `yarn lint` — ESLint across the monorepo
- `yarn typecheck` — `tsc --noEmit` across the monorepo
- `yarn test` — Vitest (watch mode in dev, single-run in CI)
- `yarn test:e2e` — Playwright
- `yarn tokens` — regenerate design tokens
- `yarn storybook` — run Storybook for `packages/react`
- `yarn seed` — reset + seed the database
- `yarn format` — Prettier

**Deploy:** `git push` to `main` → Vercel auto-deploys. No manual step.

---

## 15. Implementation order (hackathon schedule)

Not a project plan — an ordering. Each block depends on the ones above it.

| Block | What | Why first |
| --- | --- | --- |
| 0 | Repo scaffold, Next.js + Turbo + Drizzle + Supabase + Tailwind wired up. `/api/health` green. | Nothing else works without it. |
| 1 | DB schema + seed script. Stubbed auth (role dropdown + cookie). | Every screen reads data; nothing to show until tables exist. |
| 2 | JD Studio: template pick → edit → HR approve → publish → rubric extraction + link generation. | All downstream data comes from a published JD. |
| 3 | Application intake: hosted page + resume upload + parse + insert. | Unlocks real data in the system. |
| 4 | Shortlist engine: embedding + scoring + ranked list + side panel. | This is the headline AI moment of the demo. |
| 5 | Interviewer workspace: briefing + scorecard + blind-until-submit + submit-gates-advancement. | Completes the hiring loop. |
| 6 | Debrief: aggregation + outlier flag + HM decision. | Closes the loop with a visible outcome. |
| 7 | Demo polish: seed data, landing page with role switcher, quick walk-through script. | Only value if demo is buttery smooth. |

Cuts, in order, if we slip (matches research §9):

1. Live market-data snippets — skip.
2. Multiple JD templates — ship 1, say "more post-demo."
3. Debrief outlier flag — ship simple average.
4. Qualifying questions — ship form with resume only.

**Never cut:** hosted application page, ranked shortlist, scorecard submission.

---

## 16. Risks and open questions

| Risk / Question | Mitigation / Owner |
| --- | --- |
| PDF parsing accuracy for poorly-formatted resumes | Fallback to raw-text + manual-fill. Test with 5 real resumes before demo. |
| LLM cost overrun during demo (loops, retries) | Daily budget cap in `ai_calls`. Prompt caching for the JD embedding. |
| Knockout rules encoded in JD markdown are fragile | MVP hardcodes 3 knockouts (work-auth, location, min YOE). Structured knockout editor is v1.1. |
| Stubbed auth leaks into v1.1 | Design every handler as if `user` came from real auth today. Swap is mechanical. |
| "Blind-until-submit" bypass via HR role | By design — HR sees all. Documented in PRD. Not a bug. |
| Vercel cold-starts on hosted application page | Supabase + Vercel both have warm regions; first application of the day may be slow. Acceptable. |
| Candidate count for a real req (>500) will make shortlist UI sluggish | MVP paginates at 50. Add virtualization in v1.1. |
| Prompt version drift (we change a prompt mid-demo) | All prompts versioned, all AI calls log version. We can diff. |
| How do we seed `application_links` for `?source=referral` vs. a real referral flow? | Seed one per channel per req. Referral form is v1.1. |

---

## 17. Out of scope for this document

- LinkedIn Apply Connect / Naukri RMS / Indeed / Darwin Box integrations — v1.1, separate design docs.
- Real authentication (SSO, SAML, SCIM) — v1.1.
- DEI analytics, reject-reason taxonomy, compliance tooling (NYC LL 144 / EU AI Act) — v1.1.
- Fine-tuned matching model — v2+.
- Offer management, candidate portal, mobile apps — v2+.

---

*When implementation begins, update §14 with actual scripts and §3 with any workspace changes. Everything else should remain stable through MVP.*
