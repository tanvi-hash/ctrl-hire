# In-house ATS — PRD

**Status:** Draft v1  |  **Author:** [FILL]  |  **Updated:** [FILL]

---

## 1. TL;DR

An in-house tool that turns application volume into ranked, interview-ready shortlists. Candidates apply via a hosted page. Hiring managers author JDs from templates in-tool. Interviewers evaluate against structured scorecards with context from prior rounds. MVP ships in a 1.5-day hackathon.

---

## 2. Problem

HR, hiring managers, and interviewers have no system to convert raw application volume into qualified hires. Today:

1. **Shortlisting is manual.** Resumes pile up; HR screens one-by-one with no scoring or rationale.
2. **JD authoring is a slow back-and-forth over email.** HMs draft from a blank page, send to HR, HR revises and returns, drafts cycle repeatedly. No templates, no in-tool collaboration.
3. **Interviewer feedback is unstructured.** No standard scorecards, no context from prior rounds, submissions are late or missing.
4. **Decisions aren't auditable.** Reject reasons, scoring rationale, and source-of-hire live in email and memory.

---

## 3. Users


| Role           | JTBD                                                     | Access                              |
| -------------- | -------------------------------------------------------- | ----------------------------------- |
| HR / Recruiter | Convert volume into a trusted shortlist; own JD approval | All reqs, all candidates, analytics |
| Hiring Manager | Author a JD fast; approve a shortlist they trust; hire   | Only reqs they own                  |
| Interviewer    | Walk in with context; evaluate against a rubric          | Only assigned candidates            |
| Candidate      | Apply quickly without friction                           | Public application page             |


---

## 4. Success metrics


| Metric                      | Target             |
| --------------------------- | ------------------ |
| Application completion rate | ≥70%               |
| Time-to-shortlist           | ≥60% reduction     |
| Scorecard submission rate   | ≥90%               |
| HR screening hours saved    | ≥50%               |
| Source-of-hire tracked      | 100% of applicants |


*Baselines required before launch for reduction claims.*

---

## 5. Non-goals (MVP)

Out of scope: offer management, background checks, onboarding, outbound sourcing, LinkedIn / Naukri / Darwin Box integrations, live market-data feeds, AI notetaker, candidate self-serve portal, mobile apps.

---

## 6. MVP features

Role-based access is cross-cutting: HR sees everything, HMs see only their reqs, interviewers see only assigned candidates.

### 6.1 Application Intake

Hosted, branded application page per job. Unique URLs per channel with source tag (`?source=linkedin`, etc.). Required fields: name, email, resume. Everything else optional and pre-filled from resume parse. 2–3 configurable qualifying questions per JD. Mobile-responsive. Confirmation on submit.

### 6.2 JD Studio

Library of 3–5 HR-curated role-family templates. HM picks a template, edits in-tool, submits to HR; HR reviews and approves in-tool — eliminating the email-based draft cycle. Publishing the JD produces a structured rubric (must-haves, nice-to-haves, focus attributes) that flows into the matching engine and scorecards.

### 6.3 AI Shortlist Engine

Every application is scored against the JD rubric. HR sees a ranked list per req with match score, top 3 strengths, top 3 gaps, and a 1-sentence summary per candidate. HR reviews and confirms the shortlist manually; the AI does not auto-reject or auto-advance candidates.

**Candidate detail view.** Clicking a candidate opens a side panel over the ranked list, showing a quick-scan summary without losing list context:

- Header: name, source tag, match score
- Must-have checklist (✓/✗ per requirement from the JD rubric)
- Nice-to-have checklist (✓/✗)
- 3 strengths and 3 gaps with supporting evidence from the resume
- Responses to qualifying questions
- Resume preview (inline)
- Actions: Shortlist, Reject, Save for later

The side panel is the MVP pattern — it keeps HR in a fast-triage workflow while allowing one-click deep review. Side-by-side candidate comparison is a stretch goal for MVP if time permits, otherwise v1.1.

### 6.4 Interviewer Workspace

Briefing page per assigned candidate: resume, application answers, focus attributes for this round, and "things to probe" forwarded from prior rounds. Structured scorecard with BARS rating per focus attribute, evidence notes, and overall recommendation (Strong Hire / Hire / No Hire / Strong No Hire — no neutral option).

Two rules govern feedback flow:

- **Independent feedback.** Interviewers cannot see other interviewers' feedback on a candidate until they submit their own scorecard. This prevents later-round interviewers from anchoring on earlier impressions.
- **Submission before advancement.** A candidate cannot move to the next stage until the current round's scorecard is submitted. This prevents stalled pipelines from late feedback.

### 6.5 Debrief

Triggered automatically after all scorecards for the final evaluation round are submitted (this typically happens before the culture-fit round with HR, if that round is part of the hiring pipeline). Only candidates receiving Strong Hire or Hire from all interviewers progress to the debrief stage. Appears on the HM's dashboard with a suggested action based on interviewer consensus:


| Interviewer consensus        | System action                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| All Strong Hire / Hire       | Moves to Debrief — AI suggests the strongest candidate; HM or HR makes the final call |
| All No Hire / Strong No Hire | Flagged "Recommend Reject" — HM confirms                                              |
| Mixed recommendations        | Flagged "Debrief Required" — HM convenes a debrief before deciding                    |


The debrief view shows all submitted scorecards side-by-side with average rating, recommendation distribution, and an outlier flag when interviewers strongly disagree. AI highlights the strongest candidate based on scorecard signals, but the final hire decision is always made by HM or HR — the system never auto-rejects or auto-offers.

### 6.6 HR Dashboard *(optional — likely v1.1)*

A landing view for HR showing open reqs, applications by source, pending HM approvals, pending interviewer scorecards, and stale reqs. Purpose is to answer "what needs my attention today?" across all active reqs.

Considered optional for MVP — the core hiring workflow does not depend on it. Likely deferred to v1.1 unless time permits.

---

## 7. Release plan

**MVP (1.5-day hackathon):** sections 6.1–6.6, synthetic data, stubbed auth with role dropdown, 3–5 seeded templates.

**v1.1 (post-hackathon):** LinkedIn Apply Connect + Naukri RMS integrations, Darwin Box push at hire stage, internal referral/agency intake form, live market-data for JD suggestions, real auth (SSO), automated reminders, reject-reason taxonomy, DEI analytics, compliance tooling if NYC/EU/CA exposure.

**v2+:** AI notetaker, calibration workflow, fine-tuned matching model, candidate portal, offer management, mobile apps.

---

## 8. Working assumptions

- **Role-family templates:** seeded with dummy categories (Sales, Product, Design, Engineering, Marketing) for the MVP demo.
- **Hiring manager assignment per req:** confirmed with HR.
- **Blind-until-submit as default visibility:** assumed signed off by HR for MVP; revisitable later.
- **Qualifying questions per role family:** drafted for the demo by [FILL — hackathon team or HR].
- **Hosted page subdomain (e.g., `apply.company.com`):** decision deferred to post-MVP.
- **HR usage of tool-generated application URLs:** assumed for MVP. The funnel depends on this — if HR continues using non-tool URLs in production, applications bypass the system entirely. Revisit before v1.1 rollout.

---

*Technical design, stack, and integration mechanics are out of scope for this PRD and will be covered in a separate Technical Design Document. Competitive research and compliance context are in the ATS PRD Research Foundation.*