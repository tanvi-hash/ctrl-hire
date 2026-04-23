# ctrl-hire

Internal ATS for the screen-to-interview core of hiring. HR defines a rubric,
candidates apply on a hosted page, Gemini scores each resume against the
rubric, HR confirms the shortlist manually, and assigned interviewers submit
structured scorecards with blind-until-submit visibility.

- **PRD** — [`docs/prd.md`](docs/prd.md)
- **TRD** — [`docs/ats_trd.md`](docs/ats_trd.md)
- **Design spec (HR shortlist)** — [`.claude/rules/design.md`](.claude/rules/design.md)
- **Research foundation** — [`docs/research.md`](docs/research.md)

---

## Stack

| Layer       | Pick                                          |
| ----------- | --------------------------------------------- |
| Web         | Next.js 15 (App Router) + Tailwind CSS v4     |
| DB + files  | Supabase (Postgres + Storage `resumes` bucket)|
| LLM         | Gemini 2.5 Flash via Google AI Studio         |
| Hosting     | Vercel (`git push` → auto-deploy)             |
| Auth (MVP)  | None — path-based roles, stubbed `?as=<id>`   |

---

## Prerequisites

1. **Node 20+** and **pnpm** (`corepack enable pnpm` if needed).
2. A **Supabase** project (free tier is enough). Grab the project URL, anon
   key, and service-role key from Project Settings → API.
3. A **Google AI Studio** API key for Gemini (free tier). Create at
   <https://aistudio.google.com/app/apikey>.

---

## Local setup

```sh
pnpm install
cp .env.local.example .env.local   # then fill in the four keys
```

### Apply schema + seed

The Postgres schema lives in `supabase/migrations/`. The seed is
`supabase/seed.sql`.

**Option A — Supabase dashboard:**
1. Open the project → SQL Editor.
2. Run each migration in order, then run `seed.sql`.

**Option B — Supabase CLI:**
```sh
supabase link --project-ref <your-ref>
supabase db push          # applies migrations/
psql "$DATABASE_URL" -f supabase/seed.sql
# or: supabase db reset   # wipes + re-applies migrations + seed in one go
```

See [`supabase/README.md`](supabase/README.md) for details.

### Run

```sh
pnpm dev         # http://localhost:3000
pnpm typecheck   # tsc --noEmit
pnpm lint
pnpm build       # production build
```

---

## Deploy to Vercel

1. **Import the repo.** <https://vercel.com/new> → import `tanvi-hash/ctrl-hire`.
2. **Framework preset** auto-detects as Next.js. Accept defaults.
3. **Environment variables** — copy all four from `.env.local` into the
   Vercel project's Settings → Environment Variables (scoped to Production,
   Preview, Development as appropriate):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(server-only — never prefixed `NEXT_PUBLIC_`)*
   - `GEMINI_API_KEY` *(server-only)*
4. **Deploy.** The first build runs on push; subsequent `git push` to `main`
   triggers auto-deploys. Demo on the `*.vercel.app` URL; custom domain
   deferred (TRD §12).
5. **Apply the Supabase migrations once** against the project the keys point
   at (same steps as local setup).

No `vercel.json` needed — Next.js 15 handles routing, dynamic/static
detection, and serverless function config automatically. The long-running
routes (`/api/apply/:slug`, `/api/applications/:id/score`) already declare
`export const maxDuration = 30` to give Gemini headroom on Vercel.

---

## Demo walkthrough (≈ 5 minutes)

A clean-room run through the MVP. Seed data exists but this script assumes
you want to see the full create-to-scorecard flow.

### 1. HR creates a requisition

- Go to **`/hr`** → **+ New requisition**.
- Fill:
  - **Title** — `Senior Frontend Engineer`
  - **Role family** — `Engineering`
  - **Must-haves** (Enter after each) — `React (3+ yrs)`, `TypeScript`,
    `Next.js or Remix`, `Production-scale experience`, `Designer collaboration`
  - **Nice-to-haves** — `Design systems`, `Performance`, `Accessibility`, `Testing depth`
  - **Focus attributes** — `Systems thinking`, `Code quality`, `Collaboration`,
    `Product sense`
- Click **Publish**. You land back on `/hr` with the candidate URL banner:
  `/apply/senior-frontend-engineer`.

### 2. Candidate applies

- Open the `/apply/senior-frontend-engineer` URL (fresh tab/incognito is fine).
- Fill name + email, attach a PDF resume (≤ 5 MB). Click **Submit
  application**.
- The request takes a few seconds — Gemini is scoring synchronously
  (TRD §5). Up to ~10 s; if it takes longer, scoring will fall back to
  "Not scored" and a retry button appears in HR.
- You see the "Application received" confirmation.

### 3. HR reviews the shortlist

- Back on `/hr`, click **Open →** next to the req.
- The ranked list shows the candidate with their match score (`X.Y/10`),
  the 3 strengths + 3 gaps, summary, and row-level Approve / Save / Reject icons.
- Click the card to open the **side panel** — large score with meter,
  inline resume iframe (10-min signed URL), Summary / Must-haves with ✓/✗
  per requirement (hover for evidence) / Nice-to-haves / Strengths / Gaps.
- Click **Approve**. The card re-renders with a green `Shortlisted` pill.

### 4. HR assigns interviewers

- Re-open the shortlisted candidate's side panel.
- In the **Interviews** section, pick one or two interviewers as chips
  (e.g. Ameya + Rekha), type a round label (`Screen`), click **Assign**.
- The assignment appears inline with the round pill + interviewer name.

### 5. Interviewer runs the round

- Go to `/interviewer`.
- Pick yourself from the list (stubbed auth — click e.g. **Ameya Rao**).
- The queue shows the candidate, their role, the round `Screen`, and a
  `Pending` pill.
- Click **Open briefing →**.
- The briefing shows the role header, resume iframe, and focus attributes.
- Notice the **"Blind until submit"** notice at the bottom — other
  scorecards are intentionally hidden.
- Fill the scorecard:
  - BARS 1–4 per focus attribute (4 = Exceeds).
  - Evidence notes.
  - Pick **Hire** or **Strong Hire**.
- Click **Submit scorecard**.

### 6. After submit

- The page flips to read-only. Your ratings, notes, recommendation are shown.
- The "Blind until submit" section is replaced with **Other scorecards · N**
  (populated if a second interviewer has already submitted).
- Back in the queue (`/interviewer?as=<your id>`), the item now shows
  `Submitted`.

### What's visible from the HR side now

- The candidate stays `shortlisted` until HR decides what to do next.
- MVP doesn't auto-advance rounds — that's a v1.1 concern (PRD §8).

---

## Known limitations (MVP)

- **No auth.** Every route is publicly reachable if you know the URL.
  Acceptable because this runs on a non-production Vercel URL with synthetic
  data only (TRD §6). SSO is v1.1.
- **Synchronous scoring.** The candidate waits on the `POST /api/apply/:slug`
  request while Gemini runs (target < 10 s per TRD §5). No queue, no retry
  automation. If Gemini fails, the candidate still sees success and HR's
  list shows **Not scored · Retry**.
- **Signed resume URLs expire in 10 minutes.** Reopen the side panel or
  refresh to mint a new one if you sit on a stale link.
- **No round advancement logic.** PRD §6.2 "Submission before advancement"
  is enforced conceptually (scorecards are visible only after submit) but
  MVP has no multi-stage state machine. HR sees all assignments and their
  submission state and moves things along by hand.
- **Scorecards are one-way.** Once submitted, can't be edited (409 on
  duplicate POST). PRD tone: "submission is final."
- **Things to probe forwarded from prior rounds** — PRD §6.2 calls for
  this but the TRD schema has no field for it. Noted; v1.1 adds a
  `probes` column.
- **No list / table view on the HR shortlist.** Card view only.
  Design spec (`design.md` §5.15) describes a table view — follow-up.

---

## Repo map

```
app/
├── api/                 Route handlers — every server-side POST / GET endpoint (TRD §7)
│   ├── apply/[slug]/              — candidate submit (uploads + scores)
│   ├── applications/[id]/         — detail, action, assignments, score retry
│   ├── interviewers/              — directory
│   ├── reqs/                      — create req
│   └── scorecards/                — submit scorecard
├── apply/[slug]/        Public hosted application page
├── hr/                  HR surfaces (reqs list, new, ranked shortlist)
├── interviewer/         Interviewer surfaces (picker, queue, briefing)
├── page.tsx             Role switcher landing
├── layout.tsx           Fonts, global CSS
└── globals.css          Design tokens (:root + @theme) + Tailwind v4 import

components/
├── nav.tsx                    Top glass nav with dynamic breadcrumb
└── ui/
    ├── button.tsx             .btn variants per design.md §5.17
    ├── chip-list.tsx          Type-and-Enter multi-input
    ├── input.tsx              Input + Label + FieldHint
    ├── row-actions.tsx        Approve / Save / Reject trio
    ├── score-block.tsx        X.Y/10 + meter + NotScored/Retry
    └── stage-pill.tsx         Outlined pipeline-stage pill

lib/
├── cn.ts                className join
├── gemini.ts            Gemini 2.5 Flash REST client (TRD §5)
├── scoring.ts           scoreApplication() — ties Storage + Gemini + DB
├── slug.ts              slugify + uniqueSlug
└── supabase/
    ├── admin.ts         service-role client, server-only
    ├── client.ts        browser anon client
    └── server.ts        SSR anon client with cookie bridge

supabase/
├── migrations/          6 tables + private `resumes` bucket (TRD §4, §9)
├── seed.sql             3 interviewers, 1 published req, 6 applications + scores
└── README.md            How to apply

design-explorations/     Four HTML direction studies — 04-soft was picked
docs/                    PRD, TRD, research foundation
.claude/rules/
└── design.md            Visual spec for the HR shortlist screen
```

---

## Scripts

| Command           | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `pnpm dev`        | Next dev server on `:3000`                        |
| `pnpm build`      | Production build                                  |
| `pnpm start`      | Serve the production build                        |
| `pnpm typecheck`  | `tsc --noEmit`                                    |
| `pnpm lint`       | ESLint via `next lint`                            |

---

*Ship it.*
