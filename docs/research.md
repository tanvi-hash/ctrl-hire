# In-house ATS: PRD Research Foundation

*Consolidated from full research, filtered through the hosted-application-page MVP approach. Intended to feed directly into the PRD.*

---

## 1. Executive summary

A company hiring ~50 people/year across ~12,000+ annual applications currently relies on manual, inbox-style triage. Darwin Box aggregates applications but does not rank them. Hiring managers author JDs without market signal, interviewers evaluate without structure, and decisions live in email and memory. The proposed in-house tool ingests candidates via a hosted application page with configurable qualifying questions, ranks them against the JD with explainable AI, and routes them through role-scoped views into structured scorecards with cross-round context. The 1.5-day hackathon MVP proves the end-to-end workflow; integrations with external systems are deliberately deferred.

---

## 2. Problem statement

HR, hiring managers, and interviewers lack a system that converts raw application volume into qualified, ranked, interview-ready candidates — resulting in manual triage, inconsistent evaluation, and no audit trail from JD to hire.

Four failure modes define it:

1. **Shortlisting is manual and unscalable.** Resumes arrive as an unranked pile. HR screens them one-by-one against memory of the JD, with no scoring framework, no surfaced rationale, and no way to scale beyond human throughput.
2. **JD authoring is a slow, repetitive back-and-forth between HR and hiring managers.** HR asks the hiring manager to draft from scratch, the hiring manager sends it back, HR reviews and revises — the requisition waits on repeated email cycles. There is no shared template library, no structured starting point, and no standardization across roles, so JD quality depends entirely on how much effort an individual hiring manager puts in from a blank page.
3. **Interviewer feedback is unstructured and siloed.** Interviewers operate without standardized scorecards, without context from prior rounds, and without enforced submission timelines — producing inconsistent evaluations, rating drift, and debriefs based on recall rather than evidence.
4. **The hiring process has no single system of record for decisions.** Scoring rationale, reject reasons, scorecard history, and source-of-hire are distributed across email, memory, and spreadsheets — making the pipeline neither auditable nor improvable.

---

## 3. Target users & jobs-to-be-done


| User           | Primary job-to-be-done                                                                                | Frequency of use      |
| -------------- | ----------------------------------------------------------------------------------------------------- | --------------------- |
| HR / Recruiter | Convert application volume into a trusted shortlist; maintain pipeline health                         | Daily                 |
| Hiring Manager | Author an accurate, market-aligned JD; approve a shortlist they trust; make a confident hire decision | Weekly per active req |
| Interviewer    | Walk into a round with context; evaluate against a clear rubric; submit structured feedback           | Per interview         |


---

## 4. User pain points (from research, validated against industry sources)

### HR / Recruiters


| Pain                                                    | Evidence                                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Volume overload, manual shortlisting                    | Gem 2025 benchmarks: ~258–2,500 apps per req; Equip.co: manual review is bias-prone and slow |
| No JD standardization across org                        | SHRM 2025: 75% of orgs struggle to fill roles, partially driven by inconsistent JDs          |
| Chasing scorecards from interviewers                    | Greenhouse's own adoption guidance calls this the #1 friction point                          |
| No DEI or reject-reason tracking                        | Gem 2025: recruiters lose visibility into funnel equity                                      |
| No visibility into which channels produce quality hires | Source-of-hire data is lost at ingest                                                        |


### Hiring Managers


| Pain                                                          | Evidence                                                                                      |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Low trust in shortlist quality                                | Cielo: 63% of hiring managers say recruiters don't understand the roles they fill             |
| JD authoring is a blank-page, back-and-forth exercise with HR | No template library, no standardized starting point; HR waits on HM drafts, then revises them |
| No structured way to provide input at kickoff                 | Greenhouse intake-meeting guidance documents this as a recurring gap                          |


### Interviewers


| Pain                                      | Evidence                                                                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No context from previous rounds           | Ashby product-update posts cite this as the single top reason teams switched in                                                                                    |
| Inconsistent scorecards, rubric confusion | Sackett et al. 2022 (JAP 107:11): structured interviews show ρ=.42 validity vs. ρ=.19 unstructured — 2.2× — but design quality matters enormously (80% CI .18–.66) |
| Late or missing feedback                  | Cross-vendor: submission rate is universally cited as the hardest adoption metric                                                                                  |
| Rating drift and calibration issues       | Avua, Index.dev: interviewers drift without calibration sessions                                                                                                   |
| Bias — anchoring, halo, affinity          | ACLU 2025; CHRMP; Noota                                                                                                                                            |


---

## 5. Proposed solution — four modules

1. **Application Intake** — Hosted, configurable application page per job. Candidate submits resume + structured fields + 2–3 qualifying questions defined at JD creation. Source tag passed via URL.
2. **JD Studio** — A library of HR-curated templates that hiring managers can select and customize directly in the tool, plus optional LLM-assisted drafting from role + seniority as an alternative starting point. Eliminates the blank-page problem and the repeated HR↔HM draft cycles. Output is a JD + a structured rubric (must-haves, nice-to-haves, focus attributes) that flows into the matching engine and the interview scorecards. Market-informed suggestions (trending skills, comp benchmarks) are a v1.1 enhancement layered on top of templates.
3. **AI Shortlist Engine** — Resume + application data is embedded and scored against the JD. Output: ranked list with transparent reasoning (must-have matches, gaps, top 3 strengths). AI is advisory; HR confirms shortlist.
4. **Interview Workspace** — Briefing page per interviewer with resume, application answers, and prior-round notes. Structured scorecard with BARS ratings, focus attributes, "things to probe" forward-flowing field. Blind-until-submit visibility default. Debrief view aggregates scorecards with outlier flags.

---

## 6. Core workflows

**a. Candidate application.** Candidate clicks link on LinkedIn / Naukri / referral email / career page → lands on hosted application page → completes form (required: name, email, resume; optional: everything else) → answers 2–3 JD-specific qualifying questions → submits → sees confirmation.

**b. JD authoring.** HM opens JD Studio → picks an HR-curated template for the role family (or optionally requests an LLM-drafted starting point) → edits content directly in the tool → submits to HR → HR reviews and approves in-tool (no email-based draft cycle) → JD published → unique application URLs generated per channel.

**c. Shortlisting.** Applications arrive → system parses + embeds resume → scores against JD rubric → ranks candidates → HR reviews ranked list with explanations → HR confirms shortlist → shortlist passes to HM for approval.

**d. Interview scheduling / briefing.** HM approves candidate for round → interviewer assigned → interviewer opens briefing page: resume, application answers, prior-round scorecards (if submitted), focus attributes for this round.

**e. Scorecard submission.** Interviewer rates each focus attribute on BARS scale → writes evidence → adds "things to probe" for next round → submits → stage advancement gated on submission.

**f. Debrief.** All scorecards for a candidate aggregated in one view with average + outlier flag → panel discusses → HM makes decision.

---

## 7. Feature requirements

### MVP — 1.5-day hackathon

**Application Intake**

- Hosted application page (mobile-responsive)
- Configurable required vs. optional fields per JD
- Resume upload with parse-on-upload to pre-fill fields
- 2–3 configurable qualifying questions per JD
- Source tagging via URL parameters (`?source=linkedin&campaign=sde_nov`)
- Candidate confirmation screen

**JD Studio**

- Library of 3–5 pre-populated HR-curated role-family templates (primary path — eliminates the blank-page problem and repeated HR↔HM draft cycles)
- LLM-assisted draft from role + seniority as an alternative starting point
- In-tool editing by hiring manager; HR approval flow
- Must-have vs. nice-to-have skill extraction from the final JD
- Published JD generates unique application URL(s)
- *Deferred to v1.1:* market-informed suggestions (trending skills, comp benchmarks)

**AI Shortlist Engine**

- Resume text extraction + embedding
- JD embedding + rubric extraction
- Weighted scoring: must-have match + nice-to-have match + semantic similarity
- LLM-generated top-3 reasons per candidate
- Ranked list UI with recruiter override / confirm action

**Role-scoped Views**

- HR: all reqs, all pipelines, all candidates, dashboards
- Hiring Manager: assigned reqs only, ranked shortlist, approve/reject
- Interviewer: only assigned candidates, briefing + scorecard only

**Interviewer Scorecards**

- BARS rating (1–4, no neutral option)
- 2–4 focus attributes per stage, defined at JD level
- "Things to probe next round" field
- Blind-until-submit default (configurable)
- Submission gates stage advancement

**Debrief View**

- Per-candidate aggregated scorecard summary
- Outlier/disagreement flag

### v1.1 — Post-hackathon

- LinkedIn Apply Connect partnership (Easy Apply → tool)
- Naukri RMS API integration
- Indeed Apply integration
- Internal "submit a candidate" form for referrals/agencies
- Email-drop inbox for passive applicants
- Darwin Box one-way push at hire stage
- Live market-data feed (Lightcast or LinkedIn Talent Insights)
- Automated scorecard submission reminders
- Reject-reason taxonomy + DEI analytics
- Anonymization toggle
- @mentions, Slack/email notifications
- NYC LL 144 / EU AI Act compliance tooling (if applicable)

### v2+ — Future

- AI notetaker / interview transcript overlay
- Calibration session workflow
- Fine-tuned matching model trained on historical hire outcomes
- Native mobile app for interviewers
- Candidate portal (application status, withdrawal, updates)
- Fine-grained skill-graph matching (ESCO / Lightcast Open Skills traversal)
- Offer management
- Full SSO, SOC2, audit tooling

---

## 8. Competitive patterns — what to copy, what to avoid


| Vendor                          | Pattern worth copying                                                   | Why                                                            |
| ------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Greenhouse**                  | Scorecard visibility toggle: Never / Always / Only after submitting own | Industry benchmark for bias mitigation + collaboration balance |
| **Greenhouse**                  | Focus attributes per stage                                              | Caps interview scope, increases evaluation quality             |
| **Greenhouse**                  | Stage-advancement gated on scorecard submission                         | Solves the #1 adoption problem (late feedback)                 |
| **Ashby**                       | Interview Briefings (resume + app answers + prior feedback)             | Directly solves the "interviewer walks in blind" pain          |
| **Ashby**                       | Blind-until-submit as a visibility option                               | Enforces independent judgment structurally                     |
| **Ashby**                       | AI-drafted feedback from notes                                          | Reduces friction on submission                                 |
| **Lever**                       | 4-point scale with no neutral                                           | Forces a recommendation; reduces fence-sitting                 |
| **Lever**                       | Private-vs-public note padlock per comment                              | Enables frank internal notes without candidate-exposed risk    |
| **Textio / Datapeople / Ongig** | JD optimization with inclusive-language flags                           | Directly addresses JD-market misalignment                      |
| **Eightfold**                   | Explainable match with reference-profile conditioning                   | Transparency is a compliance + trust requirement               |


**Patterns to avoid:**

- **HireVue-style facial/tonal AI analysis** — dropped by HireVue itself in 2021 under FTC pressure; 2025 ACLU complaint still pending. Bad precedent.
- **Auto-reject on AI score alone** — directly implicated in EEOC v. iTutorGroup ($365K, 2023) and Mobley v. Workday (certified collective action, May 2025). AI must remain advisory.
- **Keyword-only screening** — misses transferable skills, produces brittle scoring. Use semantic matching.

---

## 9. Technical approach for MVP

### Resume parsing

Extract text from PDF/DOCX resumes on upload. Options: LlamaParse, Affinda (free tier), pyresparser, or OpenAI file API. Target: structured output with name, email, phone, education, experience, skills. Parse-on-upload feeds into pre-fill of optional application fields — reducing form drop-off.

### JD-to-resume matching

Two-stage approach:

1. **Semantic similarity** — embed resume + JD via `sentence-transformers/all-MiniLM-L6-v2` (local, free) or OpenAI `text-embedding-3-small`. Cosine similarity produces a base relevance score.
2. **Structured scoring** — LLM (GPT-4o-mini or Claude Haiku) returns JSON: `{ must_have_match: 0.0-1.0, nice_to_have_match: 0.0-1.0, overall: 0.0-1.0, top_strengths: [...], gaps: [...] }`.

Final score: weighted combination. Suggested starting weights: `0.5 * must_have + 0.2 * nice_to_have + 0.3 * semantic`. Tune post-MVP with validation data.

Hard knockouts (e.g., work-authorization, location, years-of-experience minimum) applied before scoring, not folded into it.

### Qualifying questions

2–3 configurable per JD, defined at JD creation. Answer types: short text, single-select, multi-select, numeric. Answers feed into the matching engine as additional signal, and surface on the interviewer briefing page.

### Recommended stack (hackathon-appropriate)

- **Frontend (candidate-facing):** Next.js for polish, or Streamlit for speed
- **Frontend (internal):** Streamlit if time is tight; Next.js if team has React experience
- **Backend:** FastAPI (Python) for fast iteration, matches LLM/ML ecosystem
- **DB:** SQLite + pgvector extension, or Chroma for zero-config vector storage
- **Embeddings:** sentence-transformers (local, free) or OpenAI
- **LLM:** GPT-4o-mini or Claude Haiku — cheap, fast, adequate for scoring + JD drafting
- **Resume parse:** LlamaParse or pyresparser
- **Auth:** Stub with role dropdown for demo (HR / HM / Interviewer)
- **Deploy:** Vercel / Render / Railway

### What to cut if time slips (in order)

1. Live market-data snippets (fake with pre-written examples)
2. Multiple JD templates (ship 1 instead of 3–5)
3. Debrief outlier flag (ship simple average only)
4. Qualifying questions (ship form with resume only)
5. **Never cut:** the hosted application page, the ranked shortlist, the scorecard submission flow — these are the core demo.

---

## 10. Design principles (convergent patterns across Greenhouse, Ashby, Lever)

### Bias mitigation

1. Independent scorecard submitted **before** verbal debrief
2. BARS anchors, not vague 1–5 scales
3. Blind-until-submit as default (admin can override)
4. Forced recommendation — no neutral option
5. Focus attributes: 2–3 per interview, not open-ended rubrics

### Workflow

1. Gate stage advancement on structured-feedback submission
2. Show AI reasoning openly; never hide the "why"
3. Role-scoped views prevent information overload and reduce bias leakage
4. Source tag every candidate from first touch
5. Treat AI as advisory; human confirms every directional decision

---

## 11. Success metrics


| Metric                             | Target                                           | How measured                                                                                 |
| ---------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Application completion rate        | ≥70%                                             | Completed / started on hosted page                                                           |
| Time-to-shortlist reduction        | ≥60%                                             | JD publish → 5-candidate shortlist, vs. baseline                                             |
| Scorecard submission rate          | ≥90%                                             | Rounds with scorecard submitted before next stage                                            |
| HR manual-screening hours saved    | ≥50%                                             | Pre/post self-reported time tracking                                                         |
| Interviewer "context availability" | ≥4/5                                             | Single-question post-interview survey                                                        |
| Structured field capture rate      | ≥95%                                             | Candidates with all required fields filled                                                   |
| Source-of-hire tracked             | 100% of applicants                               | Previously 0% — free dividend                                                                |
| JD quality score                   | ≥80%                                             | Internal 6–8-item rubric: salary stated, BARS-aligned competencies, inclusive language, etc. |
| Quality-of-hire proxy              | 90-day retention of MVP-sourced hires ≥ baseline | Longitudinal, post-MVP                                                                       |


**Note on baselines:** Without current-state measurements for time-to-shortlist, HR screening hours, and scorecard submission, the percentage-reduction targets are unverifiable. Capturing baselines before or during the hackathon is a hard prerequisite to claiming impact post-launch.

---

## 12. Compliance considerations


| Jurisdiction | Law                                   | Applies if                                | Implication                                                                                                               |
| ------------ | ------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| NYC          | Local Law 144 (AEDT)                  | Any NYC-based candidate evaluated with AI | Annual independent bias audit, public posting, candidate notice, right to alternative process. Penalties $500–$1,500/day. |
| EU           | AI Act (employment AI is "high-risk") | Any EU candidate                          | Conformity assessment, risk mgmt, data governance, human oversight, logging                                               |
| California   | AB 2930 / FEHA ADS rules              | Any CA candidate                          | 4-year recordkeeping; anti-discrimination                                                                                 |
| Colorado     | SB 24-205 (Feb 2026)                  | Deployer of high-risk AI                  | Developer/deployer obligations for consequential decisions                                                                |
| US Federal   | EEOC Title VII / ADA / ADEA guidance  | Always                                    | Disparate-impact liability regardless of AI use                                                                           |


**Landmark cases to internalize:**

- **Mobley v. Workday (2025)** — certified nationwide collective action; class size potentially "hundreds of millions"; age/race/disability discrimination via ATS
- **EEOC v. iTutorGroup (2023)** — $365K settlement; first EEOC AI-hiring case; system rejected women ≥55 and men ≥60
- **Amazon internal tool (2018)** — scrapped because it learned to penalize "women's" in resumes
- **ACLU v. Intuit/HireVue (March 2025)** — active; Deaf Indigenous candidate alleging discrimination

**Design implications for MVP:**

1. AI must be advisory; recruiter must confirm every shortlist / rejection
2. Log every scoring decision (feature list, weights, model version, date) for future audit
3. Expose scoring rationale to users — no black-box rankings
4. Plan a voluntary demographic self-ID field in v1.1 for internal 4/5ths-rule monitoring
5. Candidate notice template + consent text on the application page from day 1 (low cost, large downstream value)

---

## 13. Design decisions & tradeoffs to resolve in PRD


| Tension                                                   | Recommended resolution                                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| HR wants JD standardization vs. HM wants flexibility      | HR-defined required sections; HM can edit within them; template fork is audited                |
| HR wants to see all feedback vs. interviewer independence | Blind-until-submit default; admins can view post-submit; override logged                       |
| Speed of hiring vs. scorecard rigor                       | Gate stage advancement on submission; reduce number of interviews instead of shortening rubric |
| AI ranking authority vs. recruiter judgment               | AI scores + explains; recruiter confirms. Never auto-reject.                                   |
| Minimum application form vs. data completeness            | Required: name, email, resume. Everything else optional + pre-filled from resume parse.        |
| Candidate drop-off vs. structured data capture            | Minimize required fields; mobile-first; optional "Continue with LinkedIn" in v1.1              |


---

## 14. Open questions & information gaps

### Must answer before MVP build

- Which 3–5 role families to pre-populate (pick most-hired roles for demo relevance)
- Minimum required fields on the application form (recommend: name, email, resume only)
- 2–3 qualifying questions per role family — who drafts these for the demo?
- Default visibility mode — recommend blind-until-submit, confirm with HR
- LLM/embedding provider — OpenAI vs. Anthropic vs. local (affects cost, speed, privacy story)

### Must answer before v1.1 planning

- Exact Darwin Box SKU and recruitment-module configuration
- Current channel mix (LinkedIn / Naukri / referrals / agencies / career page proportions)
- Jurisdictional footprint (NYC / EU / CA / CO exposure determines compliance surface)
- Baseline metrics: current time-to-shortlist, HR screening hours/week, scorecard submission rate
- Historical hire data for offline scoring-model validation

### Must answer before v2+ planning

- LinkedIn Apply Connect partner program eligibility and timeline
- Naukri RMS API cost
- Third-party bias-audit vendor selection (Warden AI, FairNow, Holistic AI) if NYC/EU exposure
- Market-data vendor: Lightcast vs. LinkedIn Talent Insights vs. Revelio Labs

---

## 15. Top risks

1. **Candidate drop-off at the hosted form.** Every additional step loses applicants. Industry drop-off on forms >5 fields is 60–80%. Mitigation: minimal required fields, mobile-first, resume-parse pre-fill.
2. **HR adoption discipline.** The tool only works if HR consistently uses tool-generated application URLs. If they revert to LinkedIn Easy Apply postings, those candidates bypass the system entirely.
3. **Scope creep in 1.5 days.** The "cut if time slips" list in §9 must be internalized before the hackathon starts, not negotiated during it.
4. **Compliance exposure if jurisdictional footprint is broader than assumed.** NYC LL 144 enforcement is active; EU AI Act employment provisions phase in 2025–2027.
5. **Unmeasurable success without baselines.** Percentage-reduction claims in §11 require pre-hackathon baseline capture; otherwise the PRD's impact narrative is weakened.

---

## Appendix: Key references from full research

- **Benchmarks:** Gem 2025 Recruiting Benchmarks; Employ 2025 Hiring Benchmarks; SHRM 2025 Talent Trends; Cielo (via Crystal Knows)
- **Structured interview validity:** Sackett, Zhang, Berry & Lievens 2022, *Journal of Applied Psychology* 107(11)
- **Scorecard patterns:** Greenhouse Structured Hiring guide; Ashby product updates on feedback visibility + interview briefings; Lever interview scorecard documentation
- **JD optimization:** Textio, Datapeople, Ongig vendor documentation; Lightcast Open Skills taxonomy
- **Matching architecture:** Eightfold engineering blog on embeddings + career trajectory models; open-source references (srbhr/Resume-Matcher, amiradridi/Job-Resume-Matching, avr2002/CV-JD-Matching)
- **Compliance:** NYC LL 144 enforcement (Deloitte, Verifywise, DLA Piper); EU AI Act employment classification; EEOC 2022 ADA + 2023 Title VII guidance
- **Cases:** Mobley v. Workday (Class Action Lawyers); EEOC v. iTutorGroup (American Bar Association); EPIC v. HireVue (EPIC.org); ACLU v. Intuit/HireVue (Fisher Phillips)

---

*This report is the PRD research foundation. It does not replace the PRD — it feeds into it. Sections 2, 3, 7, 11, 13, and 14 map directly to standard PRD sections; sections 4, 8, 10, and 12 inform the PRD's context, prior-art, and risk sections.*