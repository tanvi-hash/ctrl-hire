# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repo is **docs-only** at the moment. There is no source code, no `package.json`, no tests, and no build system on disk. The authoritative specs are:

- `docs/prd.md` — product requirements for the in-house ATS MVP (1.5-day hackathon scope).
- `docs/research.md` — competitive research, matching-engine design, scoring weights, and fallback/cut order.

Read both before proposing architecture or implementation. When the PRD and the research doc disagree, the PRD wins for MVP scope.

## Product in one paragraph

An internal Applicant Tracking System that turns raw application volume into ranked, interview-ready shortlists. Four roles with strict role-scoping: **HR** (sees everything), **Hiring Manager** (only reqs they own), **Interviewer** (only assigned candidates), **Candidate** (public hosted application page). Core flow: candidate applies → AI scores against JD rubric → HR confirms shortlist → interviewers submit structured scorecards → debrief → HM/HR decides.

## Planned stack (inferred, not yet on disk)

`.claude/settings.json` pre-authorizes a specific toolchain and a `packages/react/**` path, which implies the intended shape of the repo:

- **Monorepo:** Yarn workspaces + Turborepo (`yarn`, `npx turbo`).
- **Language/framework:** TypeScript + React, with a `packages/react/` workspace.
- **Tests:** Vitest (`npx vitest`, `yarn test:*`).
- **Lint/format/typecheck:** ESLint, `yarn format:*`, `yarn typecheck` / `npx tsc`.
- **UI:** shadcn (`npx shadcn@latest`), Storybook (`yarn storybook`, `yarn build-storybook`), and a `yarn tokens` step (design tokens).
- **Design:** Figma MCP is pre-authorized — prefer it over guessing when implementing from a Figma URL.

`docs/research.md` §9 also lists a *hackathon-appropriate* stack (Next.js / FastAPI / SQLite+pgvector / sentence-transformers / GPT-4o-mini or Claude Haiku). Treat that as a reference menu, not a commitment — the settings file is the stronger signal for the frontend workspace layout. Confirm with the user before picking a backend.

When the first real code lands, update this file with the actual commands and workspace layout.

## Non-obvious product rules (do not violate without explicit sign-off)

These are invariants that shape schema, API, and UI decisions. They are easy to miss by reading code alone.

1. **Blind-until-submit.** An interviewer cannot see any other interviewer's feedback on a candidate until they submit their own scorecard. This is the default visibility and a bias-mitigation requirement, not a nice-to-have (PRD §6.4, research §10).
2. **Submission gates advancement.** A candidate cannot move to the next stage until the current round's scorecard is submitted. Pipeline state transitions must enforce this server-side.
3. **AI is advisory, never terminal.** The system never auto-rejects, auto-advances, or auto-offers. HR confirms the shortlist manually; HM/HR makes the final hire call. Any code path that mutates candidate state on an AI signal alone is a bug.
4. **Forced recommendation.** Scorecard overall recommendation is exactly one of: *Strong Hire / Hire / No Hire / Strong No Hire*. There is no neutral option — do not add one.
5. **BARS, not 1–5.** Focus-attribute ratings use behaviorally-anchored rating scales, not vague numeric scales. Focus attributes are 2–3 per interview, defined at JD publish time.
6. **Hard knockouts run before scoring.** Work-auth, location, min-YOE filters are applied before the matching score is computed — they are not folded into the score. Starting score weights (research §ranked-match): `0.5 * must_have + 0.2 * nice_to_have + 0.3 * semantic`.
7. **Source tag is mandatory from first touch.** Every application URL carries a source tag (e.g. `?source=linkedin`). Source-of-hire tracking depends on this — do not drop the tag through redirects or form resets.
8. **Role-scoped queries at the data layer.** HR sees everything; HM sees only their reqs; Interviewer sees only assigned candidates. Scope at the query/authorization layer, not only in the UI — UI-only scoping leaks via any API consumer.
9. **JD publish produces a structured rubric.** Publishing a JD emits must-haves, nice-to-haves, and focus attributes as structured data that flows into both the matching engine and the scorecard. JD text alone is not enough.
10. **Debrief trigger is automatic.** Debrief auto-triggers when all scorecards for the final evaluation round are submitted, but only for candidates with unanimous Strong Hire / Hire. Mixed or all-No-Hire produce different suggested actions (PRD §6.5 table) — implement all three branches.

## MVP cut order (if time slips)

From `docs/research.md` §9, in order: (1) live market-data snippets, (2) multiple JD templates (ship 1), (3) debrief outlier flag, (4) qualifying questions. **Never cut:** hosted application page, ranked shortlist, scorecard submission. Let these drive prioritization when trading scope.

## Settings and permissions

`.claude/settings.json` runs in `bypassPermissions` mode with an allowlist scoped to the tooling above, Figma MCP, `gh`, and writes restricted to `packages/react/**`. A `PermissionRequest` hook blocks any Bash command whose input matches `credentials|secret|password|api_key|apikey|token` — if a legitimate command trips this, rename the variable rather than disabling the hook. `git push --force` is explicitly denied.
