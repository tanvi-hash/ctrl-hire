# HR Shortlist — Design Spec

**Status:** Draft v1  |  **Scope:** `design-explorations/04-soft.html` (direction: "soft")  |  **Updated:** 2026-04-23

---

## 1. Overview

One of four visual directions explored for the HR shortlist screen of ctrl-hire (PRD §6.2, TRD §2). "Soft" is a warm, calm, high-legibility direction — the default recommendation for HR who spend hours triaging candidates.

The screen turns raw applications into a ranked, reviewable list. AI scores are advisory; HR confirms the shortlist manually (PRD invariant §3 "AI is advisory, never terminal"). The design leans into that: scores are subdued, confirmation actions (approve / save / reject) are one tap away on every row, and a deep-dive panel opens inline without losing list context.

The implementation is a single `.html` file using Tailwind CSS v4 via `@tailwindcss/browser`, with all design tokens defined at `:root` and component rules composed via `@apply` over Tailwind's utility layer.

---

## 2. Design principles

| Principle                    | What it means here                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Calm over loud**           | Warm radial-gradient background, muted ink, Inter + Instrument Serif. No hot accents; stage colors are tinted, not saturated. |
| **Score is a hint, not a verdict** | Scores render as a number + thin meter; approve/save/reject live next to every row to reinforce HR's agency.              |
| **Read-first, act-second**   | Full candidate summary and contact are visible on the card before any action. Side panel is additive, not required.         |
| **State you can feel**       | Every interactive element has a hover + focus story; stage filters, view toggle, and row actions all animate in ≤ 150 ms.    |
| **Tokens all the way down**  | Every color, font, radius, shadow, font size, and spacing value resolves to a named token — no raw hex, no ad-hoc px for semantic values. |

---

## 3. Foundations

All tokens live at `:root` (canonical) and are mirrored in an `@theme` block so Tailwind v4 can generate utilities from them. See §8 for the dual-declaration rationale.

### 3.1 Color

Colors are grouped by semantic role, not by hue. Every foreground color has a matching background + border + dot in its group where relevant.

#### Ink (text)

| Token                       | Value      | Use                              |
| --------------------------- | ---------- | -------------------------------- |
| `--color-ink`               | `#1f1b2e`  | Primary body text, filled CTAs   |
| `--color-ink-soft`          | `#4a4560`  | Secondary text, strong labels    |
| `--color-ink-hover`         | `#302a44`  | `.btn.primary:hover` background  |
| `--color-ink-hover-strong`  | `#2a2540`  | `.btn.ok:hover` background       |
| `--color-muted`             | `#8a8598`  | Tertiary text, placeholders      |
| `--color-faint`             | `#b7b3c4`  | Disabled indicators, empty dots  |

#### Surface

| Token                       | Value      | Use                                                    |
| --------------------------- | ---------- | ------------------------------------------------------ |
| `--color-card`              | `#ffffff`  | Cards, side panel, buttons                             |
| `--color-line`              | `#ecebf1`  | Default borders, horizontal rules                      |
| `--color-line-2`            | `#f5f4f8`  | Subtle fill — KPI tiles, contact block, evi, btn:hover |
| `--color-line-3`            | `#f1eff5`  | Table cell borders (softer than `line`)                |
| `--color-line-hover`        | `#d6d3df`  | Border on hover                                        |
| `--color-hover`             | `#faf9fc`  | Table row hover fill                                   |
| `--color-hover-alt`         | `#fafafd`  | `.btn.ghost:hover`, `.resume-ico:hover`                |

#### Page gradient stops

| Token                   | Value      | Role                                   |
| ----------------------- | ---------- | -------------------------------------- |
| `--color-bg-top`        | `#fef5f0`  | Warm peach (top-left radial)           |
| `--color-bg-mid`        | `#f6f1fb`  | Lilac (top-right radial)               |
| `--color-bg-bot`        | `#edf1f7`  | Cool blue (bottom-center radial)       |
| `--color-bg-base-start` | `#fcf9f7`  | Linear gradient top (under radials)    |
| `--color-bg-base-end`   | `#f6f3f9`  | Linear gradient bottom (under radials) |

Composed into `--background-image-page` — three radial gradients layered over a vertical linear gradient. See §3.7.

#### Stage palette (pipeline state)

Each stage has **fg / border / dot** — and, for stages rendered as filled pills elsewhere, **bg**.

| Stage         | `fg`       | `border`   | `dot`      | `bg` (filled)    |
| ------------- | ---------- | ---------- | ---------- | ---------------- |
| New           | `#4a4560`  | `#e2dfea`  | `#8a8598`  | —                |
| Screening     | `#2b6fb5`  | `#c5dcf5`  | `#4583c4`  | —                |
| Shortlisted   | `#2f7d60`  | `#bfe0cd`  | `#3a9170`  | `#eef7f2`        |
| Saved         | `#b06b0e`  | `#f5dcb8`  | `#c78a38`  | `#fff7ea`        |
| Rejected      | `#b84056`  | `#f4c7d1`  | `#c05575`  | `#fdf3f5`        |

Tokens follow `--color-stage-<name>-{fg|border|dot|bg}`. Tinted backgrounds are only used when a stage is the subject of an action (e.g. a `.chip-status` header, an action button hover).

#### Source palette (applicant channel)

Filled pills — foreground + background per source.

| Source         | `fg`       | `bg`       |
| -------------- | ---------- | ---------- |
| Referral       | `#c9760f`  | `#fff3e0`  |
| LinkedIn       | `#2b6fb5`  | `#e4effc`  |
| Naukri         | `#c94660`  | `#fdecea`  |
| Career page    | `#4a4560`  | `#eff1f5`  |

Tokens follow `--color-source-<name>-{fg|bg}`.

#### Scrims & glass

| Token                | Value                      | Use                                 |
| -------------------- | -------------------------- | ----------------------------------- |
| `--color-backdrop`   | `rgb(18 12 34 / 0.28)`     | Side-panel backdrop                 |
| `--color-glass-70`   | `rgb(255 255 255 / 0.7)`   | Nav fill (over blur(14px))          |
| `--color-glass-90`   | `rgb(255 255 255 / 0.9)`   | Nav border                          |
| `--color-glass-60`   | `rgb(255 255 255 / 0.6)`   | Stage filter track                  |
| `--color-ring-soft`  | `rgb(31 27 46 / 0.08)`     | Reserved for focus rings            |
| `--color-ring-focus` | `rgb(31 27 46 / 0.05)`     | Focused KPI tile outline            |

### 3.2 Typography

Two families, both loaded from Google Fonts.

| Token            | Family                                          | Use                                          |
| ---------------- | ----------------------------------------------- | -------------------------------------------- |
| `--font-sans`    | Inter, `ui-sans-serif`, `system-ui`, sans-serif | All UI text                                  |
| `--font-serif`   | Instrument Serif, Georgia, serif                | Display — role title, candidate name in side |

Weights in use: 400, 500, 600, 700.

#### Type ramp

Semantic tokens are px-indexed and named `--text-ui-<px>`. Uncommon sizes are preserved (13.5px body, 10.5px micro-label) rather than rounded to a friendlier scale.

| Token              | Size      | Example use                                             |
| ------------------ | --------- | ------------------------------------------------------- |
| `--text-ui-10-5`   | 10.5 px   | Section heading (uppercase), KPI label, match-score lbl |
| `--text-ui-11`     | 11 px     | Brand mark letter, avatar initials, KPI label           |
| `--text-ui-11-5`   | 11.5 px   | Stage / source pill text, chip status, applied-ago      |
| `--text-ui-12`     | 12 px     | Resume button, list cell summary                        |
| `--text-ui-12-5`   | 12.5 px   | Card sub-text, contact item, evi paragraph              |
| `--text-ui-13`     | 13 px     | Nav path, buttons, list cell primary, check rows        |
| `--text-ui-13-5`   | 13.5 px   | **Body default**, card name row, cc-summary             |
| `--text-ui-14`     | 14 px     | Brand mark, side-panel summary                          |
| `--text-ui-16`     | 16 px     | Candidate name (card view)                              |
| `--text-ui-22`     | 22 px     | Score number (row)                                      |
| `--text-ui-24`     | 24 px     | KPI value                                               |
| `--text-ui-28`     | 28 px     | Candidate name (side panel, serif)                      |
| `--text-ui-30`     | 30 px     | Match-score number (side panel)                         |
| `--text-ui-40`     | 40 px     | Role title (`h1.role`, serif, italic accent)            |

Line-height is `1.5` by default; tighter values (`1.05`, `1.1`, `1.4`, `1.55`) are set inline where typography density matters (display serif, pills, side summary).

Letter-spacing: display uses `-0.01em` to `-0.02em`; uppercase micro-labels use `0.04em` to `0.1em`.

### 3.3 Spacing

Driven by Tailwind v4's dynamic `--spacing` scale at `0.25rem` (4 px) per unit. Every `p-*`, `m-*`, `gap-*`, `w-*`, `h-*` utility in the stylesheet computes as `calc(var(--spacing) * n)`.

Common steps used in this screen: `0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9.5, 10, 11, 12, 13, 15, 20, 40` → 2 px through 160 px.

Values that are intentionally **not** spacing tokens: `1px` / `2px` / `3px` border widths (CSS primitives), `grid-template-columns` values (layout templates), percent and viewport-unit widths (viewport-relative).

### 3.4 Radius

| Token             | Value       | px    | Use                                                  |
| ----------------- | ----------- | ----- | ---------------------------------------------------- |
| `--radius-brand`  | `0.375rem`  | 6 px  | Brand-dot square                                     |
| `--radius-2xs`    | `0.5rem`    | 8 px  | Resume button, list-view action button               |
| `--radius-xs`     | `0.625rem`  | 10 px | Icon action button, side-close, contact block, evi   |
| `--radius-sm`     | `0.75rem`   | 12 px | KPI tile                                             |
| `--radius-md`     | `1rem`      | 16 px | Candidate card (`.cc`), list table wrap              |
| `--radius-lg`     | `1.25rem`   | 20 px | Role header card                                     |
| `rounded-full`    | `calc(infinity * 1px)` | —   | Pills, chips, nav bar, buttons, score dot  |

### 3.5 Elevation

Dual-layer shadows throughout — a 1 px inset highlight to cheat the look of a thin top light, plus an offset soft fall.

| Token                  | Value                                                                                                | Surface              |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | -------------------- |
| `--shadow-nav`         | `0 1px 0 rgb(255 255 255 / 0.9) inset, 0 10px 30px -16px rgb(60 40 90 / 0.12)`                       | Top nav (glass)      |
| `--shadow-card-lg`     | `0 1px 0 rgb(255 255 255 / 0.9) inset, 0 20px 60px -36px rgb(60 40 90 / 0.18)`                       | Role header card     |
| `--shadow-card`        | `0 1px 0 rgb(255 255 255 / 0.9) inset, 0 6px 20px -18px rgb(60 40 90 / 0.2)`                         | Candidate card `.cc` |
| `--shadow-table`       | `0 1px 0 rgb(255 255 255 / 0.9) inset, 0 6px 20px -18px rgb(60 40 90 / 0.15)`                        | List-table wrap      |
| `--shadow-stages`      | `0 1px 0 rgb(255 255 255 / 0.9) inset`                                                               | Stage filter track   |
| `--shadow-side`        | `-30px 0 80px -30px rgb(40 25 70 / 0.35)`                                                            | Side panel (left-falling) |
| `--shadow-kpi-focus`   | `0 0 0 3px rgb(31 27 46 / 0.05)`                                                                     | Focused KPI tile     |

### 3.6 Motion

One custom ease, otherwise `ease` defaults.

| Token           | Value                             | Use                                                     |
| --------------- | --------------------------------- | ------------------------------------------------------- |
| `--ease-panel`  | `cubic-bezier(0.2, 0.9, 0.2, 1)`  | Side panel slide (0.32 s), add-candidate hover expand (0.25 s) |

Common durations: 80 ms (hover lifts), 100 ms (color crossfades), 220 ms (backdrop fade), 320 ms (panel slide). Everything is CSS-driven; no JS animation.

### 3.7 Composed tokens

| Token                       | Purpose                                    |
| --------------------------- | ------------------------------------------ |
| `--background-image-page`   | The page background stack (see §3.1)       |
| `--container-shell`         | 1500 px — app content max-width            |
| `--container-cc-main`       | 1100 px — candidate card text column cap   |
| `--container-search`        | 280 px — search field width                |
| `--container-side`          | 520 px — side panel width                  |

---

## 4. Layout

```
┌────────────────────────────────────────── shell (max 1500, px-6) ──────────────────────────────────────────┐
│  nav  (glass, rounded-full)                                                                                 │
│  role-card  (2-col grid  1.4fr : 1fr  — title/meta | KPI row)                                               │
│  toolbar  (stages ←  |  → search · view-toggle · add-cand)                                                  │
│  body                                                                                                       │
│    card view  ─ vertical stack of .cc (score | main | right-rail)                                           │
│    list view  ─ single .ltable-wrap, 10-col grid per row                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                            side (overlay 520 px)
```

- Card view packs content vertically — score meter on the left, summary + contact in the middle, age + action buttons on the right rail.
- List view is a horizontal table (`min-width: 1280 px` forces horizontal scroll on narrow viewports). Header row uses `background: var(--color-line-2)` and uppercase 10.5 px labels.
- Side panel and backdrop are fixed-position and sit on `z-index: 99`/`100`; opening them locks body scroll (`document.body.style.overflow = "hidden"`).

---

## 5. Components

Documented components, each with anatomy, states, and the rules file:line pointer.

### 5.1 Nav (`.nav`)

A full-width glass bar at the top of the shell.

**Anatomy:** brand mark (dot + wordmark) · breadcrumb path · spacer · `⌘K` button · user chip.

**Spec:** `py-2.5 px-4`, `rounded-full`, `--color-glass-70` fill over `backdrop-filter: blur(14px)`, `--shadow-nav`, `--color-glass-90` border.

**Variants:** none. Brand-dot uses `--radius-brand` (6 px) — the only non-round corner in the nav.

### 5.2 Role header (`.role-card`)

The context card that tells HR which role they're looking at.

**Anatomy (left column):** status chip + "View JD" button · `h1.role` (serif, italic accent on the craft word) · role-sub meta line.

**Anatomy (right column):** 4 KPI tiles — Applied / Scored / To review / Shortlist. The active review stage (`kpi.focus`) is outlined with `--color-ink` + `--shadow-kpi-focus` to signal "you are here".

**Spec:** `py-5.5 px-6`, `rounded-lg` (20 px), `--shadow-card-lg`, 28 px grid gap between columns.

### 5.3 Stage filter (`.stages` + `.stg`)

A segmented control listing pipeline stages with live counts.

**Anatomy per stage:** colored dot (hidden when selected) · label · count.

**Selected state (`.on`):** ink-filled pill, dot removed, count tinted `--color-faint`.

**Dot color varies by stage** (see §3.1 Stage palette → `dot`).

**Spec:** `py-1.5 px-3` per stage, `gap-1` between, whole track wrapped in `.stages` with `--color-glass-60` fill + `p-1` padding + `--shadow-stages` inset highlight.

### 5.4 View toggle (`.view-toggle`)

Two-option segmented button: Card / List. Matches stage-filter visual language (pill-on-pill).

### 5.5 Search field (`.search`)

280 px field with leading magnifier icon. `--color-card` fill, `--color-line` border, rounded-full. Placeholder in `--color-muted`.

### 5.6 Add candidate (`.add-cand`)

Hover-expanding icon button. Collapsed: 38 × 38 px `rounded-full` ink-filled button with a `+` glyph. On hover: expands to 160 px, swaps the `+` glyph for a user-plus icon, and reveals the label "Add candidates". Transition uses `--ease-panel`.

**Why expand on hover:** keeps the toolbar visually light while providing discoverability. Tap target stays ≥ 38 px.

### 5.7 Score block (`.score-wrap`)

The numeric score + thin meter used on every card and list row.

**Anatomy:** `9.2` (22 px) + subscript `/10` (11 px, muted) stacked over a 44 × 3 px meter. Meter track is `--color-line`, fill is `--color-ink` at the score percentage.

Larger variant (`.s-score .meter`) lives in the side panel at 80 × 4 px.

### 5.8 Stage pill (`.stage-pill`)

Outlined pill showing current pipeline state. Five variants (New / Screening / Shortlisted / Saved / Rejected), each driven by its stage palette (`fg` text, `border` border, `dot` the leading dot).

**Spec:** `pt-0.5 pr-2 pb-0.5 pl-1.5`, `rounded-full`, 11.5 px text, `gap-1.25` between dot and label.

### 5.9 Source pill (`.source-pill`)

Filled pill showing applicant channel. Four variants (Referral / LinkedIn / Naukri / Career page), each driven by its source palette (`fg` + `bg`, no border).

Source detail is appended after a `·` when present — e.g. "Referral · Dev Kapoor".

### 5.10 Chip status (`.chip-status`)

The "Open · accepting applications" pill in the role-card header. Always styled with the shortlisted palette. Distinguished from `.stage-pill` by a filled background and a solid (not outlined) leading dot.

### 5.11 Contact item (`.contact-item`)

Inline icon + value + hover-only copy button. Used for email and phone on both card view and list view.

**States:**
- **Rest:** icon (12 px, muted) + value in `--color-ink-soft`. Copy button opacity: 0.
- **Hover on row:** copy button fades in (opacity 1).
- **Click copy:** button takes the shortlisted palette (`.copy.copied`) for 1.1 s.

### 5.12 Resume icon button (`.resume-ico`)

A small outlined button with a document icon + "Resume" label. Sits inside `.cc-meta`. Treated as a secondary action — click is swallowed so it does NOT open the side panel.

### 5.13 Row action buttons (`.row-acts` + `.iconbtn`)

Three 32 × 32 px icon buttons at the right rail of every row: approve (check), save (bookmark), reject (x).

**Hover states pick up the stage palette they represent:**
- `.iconbtn:hover.ok` → shortlisted palette
- `.iconbtn:hover.save` → saved palette
- `.iconbtn:hover.no` → rejected palette

This is the same palette that will apply once the action is taken — hover previews the destination.

### 5.14 Candidate card (`.cc`)

The primary unit of card view.

**Anatomy:** `.cc-head` is a 3-column grid `(52 px | 1fr | auto)`:
1. **Score column** — score block, top-aligned (`pt-0.5` for optical balance).
2. **Main column** — name row (name + stage pill), sub-meta (company · location · yoe), summary paragraph (max 72ch), meta footer (contact + source + resume) separated by a dashed top border.
3. **Right rail** — "Applied Xd ago" timestamp above the three action buttons.

**Card itself:** `py-4 px-4.5`, `rounded-md`, `--shadow-card`, hover lifts `translateY(-1px)` + border shifts to `--color-line-hover`.

### 5.15 List row (`.lrow`) / List header (`.lhead`)

Tabular view with a rigid 10-column grid: Score | Candidate | Current role | Location | YOE | Email | Phone | Stage | Source | Actions.

- Header row: uppercase 10.5 px labels, `--color-line-2` fill, `--color-line` cell separators.
- Data row: truncates long text with the Tailwind `truncate` utility; hover fills with `--color-hover`.
- Action cell: same `.iconbtn` trio but shrunk to 28 × 28 px (svg 13 px) to fit the 104 px column.

The whole table has `min-width: 1280 px` + `overflow-x: auto` so narrow viewports scroll horizontally rather than squishing columns.

### 5.16 Side panel (`.side` + `.backdrop`)

Right-side overlay, 520 px / 95 vw, slides in with `--ease-panel` at 0.32 s. Backdrop fades in at 0.22 s.

**Layout, top to bottom:**

1. **`.s-head`** — stage + source pills, large serif name, sub-meta, match-score block (with 80 px meter), contact card (`.s-contact`, `--color-line-2` fill).
2. **`.s-acts`** — three primary buttons in a `1.5fr 1fr 1fr` grid: Approve (ink fill) / Save (ghost) / Reject (danger-ghost).
3. **`.s-resume`** — filename + "View resume" ghost button.
4. **`.s-body`** — stacked sections, each `py-3.5` with a bottom border:
   - **Summary** — single-paragraph 14 px body.
   - **Must-haves (n/5)** — check list. Passed items render an ink-filled circle with a check glyph; missed items render a `--color-line` circle with a middle dot, label in `--color-muted`.
   - **Nice-to-haves (n/5)** — same check list.
   - **Strengths** — `.evi` cards with a 2 px ink left border, bolded title + evidence body.
   - **Gaps** — same cards with `.evi.bad` (border-left tinted `--color-faint`).
   - **Qualifying answers** — `.qa` block: uppercase micro label + answer line.

**Open state:** body scroll locked, close button top-right, backdrop click or Escape closes.

### 5.17 Buttons (`.btn` variants)

| Variant        | Fill / Border                              | Use                                     |
| -------------- | ------------------------------------------ | --------------------------------------- |
| `primary`      | `--color-ink` / transparent                | Rare — unused in this screen            |
| `ok`           | `--color-ink` / transparent                | Approve (side panel action bar)         |
| `ghost`        | `--color-card` / `--color-line`            | Save, View resume, View JD (card chip)  |
| `danger-ghost` | `--color-card` / `--color-line`, hover → rejected palette | Reject                      |
| `subtle`       | transparent / transparent                  | Keyboard hint (`⌘K`) in nav             |

All buttons share `gap-1.75 py-2.25 px-3.5 rounded-full`, 13 px text, 14 px icons, a 1 px transparent border to prevent jitter on hover-border variants, and a subtle `translateY(-1px)` lift on hover.

---

## 6. Patterns

### 6.1 Hover previews the destination

Row action buttons preview their end state: hovering "approve" tints the button with the shortlisted palette — the same palette the card will show once approved. This halves the "what will this do?" thinking load in a triage loop.

### 6.2 Side panel, not route change

Clicking a row opens the side panel instead of navigating. List context stays visible underneath (`backdrop-filter: blur(3px)` keeps it recognizable but backgrounded). Escape or backdrop click returns focus to the row. This matters because HR often cross-reference across candidates mid-triage.

### 6.3 Source tag first-class, not buried

Every row shows the source pill prominently (card meta or dedicated list column), and source detail ("Referral · Dev Kapoor") is inlined — satisfying PRD §7 "source tag is mandatory from first touch" at the UI layer.

### 6.4 Score is ordinal, not gospel

Scores render small (22 px) and always sit next to a thin 44 px meter. The visual weight of the approve/save/reject trio equals the score's. No green-for-high, red-for-low color coding — the meter is always the same ink on the same line — because auto-rejecting on score is a product bug (PRD invariant §3).

---

## 7. Accessibility

Current state + known gaps for this exploration.

### What's in place

- **Semantic HTML:** `<nav>`, `<section>`, `<article>` for cards, `<aside>` for the side panel.
- **ARIA labels:** close button uses `aria-label="Close"`. Buttons use `title` attributes for icon-only affordances.
- **Keyboard:** `Escape` closes the side panel. The view toggle, stage filter, and all action buttons are native `<button>` elements, so they're reachable via Tab.
- **Focus order:** unaltered from DOM order — header → toolbar → cards (or list rows) → side panel content.
- **Contrast:**
  - Body text (`#1f1b2e` on page gradient) clears WCAG AA Large at all gradient stops; AA Normal at the bottom stop (`#edf1f7`) and top-left (`#fef5f0`), borderline AA on the mid lilac stop.
  - Stage pill text (`fg` on `card` white) clears AA Normal for all five stages.
  - Source pill text on its tinted `bg` clears AA Large; Referral (`#c9760f` on `#fff3e0`) and Naukri (`#c94660` on `#fdecea`) are borderline AA Normal. A follow-up pass should verify at render.
  - Muted text (`#8a8598`) should **not** be used for critical information — it's below AA Normal on a white card. It's safe for tertiary labels only.

### Known gaps (to fix before production)

- No visible focus ring on buttons. The `--color-ring-soft` / `--color-ring-focus` tokens are defined but unapplied.
- Side panel is not a focus-trap — Tab can leak to the backgrounded row list.
- Stage pill color is the only signal for state. Fine here because the text label is always rendered, but any future icon-only state indicator must also carry a shape or text.
- The hover-to-expand "Add candidates" button has no keyboard affordance — Tab gives a 38 × 38 button with no label. Fix: add an accessible name (`aria-label="Add candidates"`) and expand on `:focus-visible` too.
- `backdrop-filter: blur(14px)` on the nav falls back to a translucent fill in browsers without support; acceptable but results in a softer look.

---

## 8. Implementation

### 8.1 Runtime

Single HTML file loads Tailwind CSS v4 via the browser build:

```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

All design tokens live at `:root` in a plain `<style>` block (canonical source of truth). A second `<style type="text/tailwindcss">` block mirrors the tokens inside `@theme {}` so Tailwind v4 can generate utilities from them, and hosts `@layer base` + `@layer components` with `@apply` directives.

Why the dual declaration: `@tailwindcss/browser@4` accepts token-namespace tokens in `@theme` (e.g., `--color-*`, `--radius-*`, `--text-*`) and generates matching utility classes, but it does not always pass all user tokens through to `:root`. Declaring them directly at `:root` in a plain `<style>` block guarantees every `var(--...)` reference resolves. The mirrored `@theme` ensures Tailwind utilities generated from those tokens (via `@apply bg-card`, etc.) are available if needed.

### 8.2 Token usage rules

1. **Every color reference** goes through a `--color-*` token. No raw hex in component rules.
2. **Every radius** goes through a `--radius-*` token or `rounded-full`.
3. **Every font-size** goes through a `--text-ui-*` token.
4. **Every shadow** goes through a `--shadow-*` token.
5. **Spacing (padding / margin / gap / width / height)** goes through Tailwind's `--spacing` scale via `@apply p-*` / `gap-*` / `w-*` utilities — never `p-[10px]` arbitrary values (those bypass the token).
6. **Custom easing** uses `--ease-panel`; transition durations and 1 px / 2 px border widths are treated as CSS primitives and stay as literals.

### 8.3 Class-naming convention

Semantic, component-scoped names (`.cc`, `.cc-head`, `.cc-main`, `.stage-pill.stage-shortlisted`). Tailwind utilities are applied via `@apply` inside those class rules — not inlined in HTML. This preserves the JS contract (stateful classes like `.stg.on`, `.side.on`, `.copy.copied` are toggled by the script) and keeps the markup readable.

### 8.4 JS state model

Vanilla ES modules, no framework.

- `state = { view, stage, query, selectedId }` — single object.
- `renderCards(list)` / `renderList(list)` — render innerHTML into `#list-root`.
- `renderSide()` — renders into `#side-scroll` when `selectedId` changes.
- `.on` class toggled on `.stg`, `.view-toggle button`, `.side`, `.backdrop`, `.copy` drives all visual state.

### 8.5 Data source

Candidate data ships from `./_data.js` as a `CANDIDATES` global. Shape per candidate includes `id, name, current, location, yoe, score, stage, source, sourceDetail, email, phone, appliedAgo, summary, mustHaves[], niceHaves[], strengths[], gaps[], qualifying[]` — matches the side panel's section structure 1:1.

---

## 9. Open questions

1. **Focus ring application.** Decide whether to apply `--color-ring-focus` on all interactive elements via a `*:focus-visible` rule, or per-component.
2. **Side panel focus trap.** Use `inert` on the backgrounded content when the panel is open, or ship a small trap utility.
3. **Dark mode.** Tokens are single-theme. `prefers-color-scheme: dark` pass is out of scope for this direction; decide in direction selection.
4. **Empty / loading / error states.** Only the empty filter state (`.empty`) is designed. Loading and error states for the whole screen still need specs.
5. **Assignment flow.** Interviewer assignment from within the side panel is implied by the PRD but not present in this exploration.

---

## 10. References

- PRD — `docs/prd.md` §6.2 Shortlist Engine, §7 Source tracking, invariants §3 (AI advisory), §8 (role-scoping).
- TRD — `docs/ats_trd.md` §2 Architecture, §3 Stack (screen runs atop the Next.js + Tailwind frontend).
- Source file — `design-explorations/04-soft.html`. Companion directions: `01-terminal`, `02-editorial`, `03-brutalist`.
- Tailwind v4 `@theme` — https://tailwindcss.com/docs/theme
