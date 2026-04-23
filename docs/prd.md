# Internal ATS — PRD

**Status:** Draft v2  |  **Author:** [FILL]  |  **Updated:** 2026-04-23

---

## 1. TL;DR

An internal company tool for the screen-to-interview core of hiring. HR reviews AI-ranked candidates against a pre-loaded JD rubric and shortlists manually. Assigned interviewers walk in with context and submit structured scorecards. MVP ships in a 1.5-day hackathon.

---

## 2. Problem

HR and interviewers have no system to convert raw application volume into qualified, well-evaluated candidates. Today:

1. **Shortlisting is manual.** Resumes pile up; HR screens one-by-one with no scoring or rationale.
2. **Interviewer feedback is unstructured.** No standard scorecards, no context from prior rounds, submissions are late or missing.
3. **Decisions aren't auditable.** Reject reasons and scoring rationale live in email and memory.

---

## 3. Users (MVP)


| Role           | JTBD                                                         | Access                   |
| -------------- | ------------------------------------------------------------ | ------------------------ |
| HR / Recruiter | Convert volume into a trusted shortlist; assign interviewers | All reqs, all candidates |
| Interviewer    | Walk in with context; evaluate against a rubric              | Only assigned candidates |
| Candidate      | Apply quickly without friction                               | Public application page  |


*Hiring Manager role is v1.1+.*

---

## 4. Success metrics


| Metric                      | Target         |
| --------------------------- | -------------- |
| Application completion rate | ≥70%           |
| Time-to-shortlist           | ≥60% reduction |
| Scorecard submission rate   | ≥90%           |
| HR screening hours saved    | ≥50%           |


*Baselines required before launch for reduction claims.*

---

## 5. Non-goals (MVP)

Out of scope: JD document authoring, role-family templates, HM–HR approval flow, rubric extraction from JD text, debrief workflow, HR dashboard, interview scheduling, offer management, background checks, onboarding, outbound sourcing, LinkedIn / Naukri / Darwin Box integrations, live market-data feeds, AI notetaker, candidate self-serve portal, mobile apps.

---

## 6. MVP features

The MVP covers the define-to-interview path end-to-end: HR defines a rubric, the system ranks applicants against it, HR shortlists, and assigned interviewers evaluate against the same rubric.

### 6.1 AI Shortlist Engine

- **Application intake (minimal).** Hosted page per job: name, email, resume upload. Mobile-responsive. Confirmation on submit.
- **Scoring.** Every application is scored against the pre-loaded JD rubric. Ranked list per req shows match score, top 3 strengths, top 3 gaps, and a 1-sentence summary per candidate.
- **Candidate side panel.** Clicking a candidate opens a side panel over the ranked list — HR stays in fast-triage with one-click deep review. Contents:
  - Header: name, match score
  - Must-have checklist (✓/✗ per requirement)
  - Nice-to-have checklist (✓/✗)
  - 3 strengths + 3 gaps with resume evidence
  - Resume preview (inline)
  - Actions: Shortlist / Reject / Save for later
- **Manual HR control.** AI ranks and explains; HR confirms every shortlist and reject. No auto-advance, no auto-reject.

### 6.2 Interviewer Workspace

- **Assignment.** From a shortlisted candidate, HR assigns one or more interviewers and a round label.
- **Briefing page per assigned candidate.** Resume, focus attributes for this round (from the JD rubric), and "things to probe" forwarded from prior rounds.
- **Structured scorecard.** BARS rating per focus attribute, evidence notes, and overall recommendation: Strong Hire / Hire / No Hire / Strong No Hire (no neutral option).

Two rules govern feedback flow:

- **Independent feedback.** Interviewers cannot see other interviewers' feedback on a candidate until they submit their own scorecard. Prevents later-round interviewers from anchoring on earlier impressions.
- **Submission before advancement.** A candidate cannot move to the next round until the current round's scorecard is submitted. Prevents stalled pipelines from late feedback.

### 6.3 Rubric Setup

HR defines the rubric when creating a req. This closes the loop — no out-of-band seeding, the tool is usable end-to-end on day one.

- **Req basics.** Title, role family (free text for MVP), owner (HR who created it).
- **Rubric fields.** Three lists, HR types entries directly:
  - Must-haves (hard requirements — drive the must-have ✓/✗ in the side panel)
  - Nice-to-haves (preferred — drive the nice-to-have ✓/✗)
  - Focus attributes (competencies interviewers rate against in scorecards)
- **Publish.** Publishing generates the candidate application URL and makes the req visible in HR's ranked-list view.

Deliberately not in MVP (stays v1.1 as JD Studio): role-family templates, HM→HR approval cycle, rubric extraction from JD text, versioning, multi-round focus-attribute mapping.

### 6.4 Out of scope for MVP features

- Qualifying questions on the application form
- Branded / configurable application page
- Side-by-side candidate comparison
- Bulk actions
- Candidate-facing notifications beyond submit confirmation
- In-tool interview scheduling / calendar sync
- Automated reminders for unsubmitted scorecards

---

## 7. User flow

**Candidate:**

1. Opens the application URL for a req.
2. Submits name, email, resume.
3. Sees confirmation.

**HR:**

1. Logs in (stubbed auth, role dropdown).
2. Creates a req → defines rubric (must-haves, nice-to-haves, focus attributes) → publishes. Candidate URL generated.
3. Picks an open req → sees candidates ranked by match score.
4. Clicks a candidate → side panel opens with match breakdown and resume.
5. Clicks Shortlist / Reject / Save for later.
6. For shortlisted candidates, assigns interviewer(s) and round label.
                                         

**Interviewer:**

1. Logs in → sees assigned candidates.
2. Opens briefing page: resume, focus attributes, probes from prior rounds.
3. Conducts the interview (scheduled out-of-band).
4. Submits structured scorecard. Cannot view others' feedback until submission.
5. Candidate becomes eligible to advance only after this round's scorecards are all in.

---

## 8. Release plan

**MVP (1.5-day hackathon):** Sections 6.1–6.3. Synthetic candidate data, stubbed auth with role dropdown. HR creates reqs and rubrics in-tool.

**v1.1 (post-hackathon):**

- **JD Studio:** role-family templates, in-tool HM→HR approval cycle, rubric extraction from JD text, versioning (upgrades the MVP's minimal rubric form).
- **Full Application Intake:** branded pages, 2–3 configurable qualifying questions per JD, resume-parse prefill.
- **Debrief:** consensus-based routing (all Hire → AI-suggested pick; all No Hire → reject; mixed → debrief required), side-by-side scorecards, outlier flag. Final call always HM/HR.
- **HR Dashboard:** open reqs, applications by source, pending HM approvals, pending scorecards, stale reqs.
- **Hiring Manager role:** req ownership, shortlist approval, debrief decision.
- **Ops:** automated scorecard reminders, reject-reason taxonomy, real auth (SSO).
- **Integrations:** LinkedIn Apply Connect, Naukri RMS, Darwin Box push at hire, referral/agency intake, live market-data for JDs, DEI analytics, compliance tooling if NYC/EU/CA exposure.

**v2+:** AI notetaker, calibration workflow, fine-tuned matching model, candidate portal, offer management, mobile apps, in-tool scheduling.

---

## 9. Working assumptions

- **Internal, single-tenant tool.** Deployed for Vymo. HR and interviewers are Vymo employees; candidates are external applicants. No multi-tenant, no white-labeling, no customer-facing branding.
- **Rubrics are defined in-tool.** HR types must-haves, nice-to-haves, and focus attributes into a minimal form when creating a req. Templates, HM→HR approval, and rubric extraction from JD text ship in v1.1 as JD Studio.
- **HR and Interviewer are the only internal roles in MVP.** Hiring Manager flow is v1.1.
- **Interview scheduling is out-of-band.** Calendar invites and timing live outside the tool for MVP.
- **Blind-until-submit as default visibility:** assumed signed off by HR for MVP; revisitable later.
- **HR uses tool-generated application URLs.** The funnel depends on this — if HR keeps sending non-tool URLs, applications bypass the system. Revisit before v1.1 rollout.
- **Hosted page subdomain:** `apply.vymo.com`. Candidate application URLs live under this domain.

---

*Technical design, stack, and integration mechanics are out of scope for this PRD and will be covered in a separate Technical Design Document. Competitive research and compliance context are in the ATS PRD Research Foundation.*