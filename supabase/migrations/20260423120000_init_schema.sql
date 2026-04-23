-- Internal ATS — initial schema
-- Spec: docs/ats_trd.md §4 (Data model)
-- No auth, no RLS (TRD §6 — "not a security boundary in MVP"; synthetic data only).

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Interviewers — seeded directory; the only person-tied table in MVP.
-- HR and Candidate do not need rows (TRD §4 notes).
-- ─────────────────────────────────────────────────────────────────────────────
create table interviewers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Reqs — a role + its rubric. Publishing generates the candidate URL (PRD §6.3).
-- `slug` is not in TRD §4 literally but is required by TRD §7 (`/apply/:req_slug`);
-- added here as the route-safe identifier.
-- ─────────────────────────────────────────────────────────────────────────────
create table reqs (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  role_family      text not null,
  must_haves       text[] not null default '{}',
  nice_to_haves    text[] not null default '{}',
  focus_attributes text[] not null default '{}',
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Applications — candidates who applied to a req.
-- `status` enumerated via CHECK (cheaper to evolve than a Postgres enum type).
-- ─────────────────────────────────────────────────────────────────────────────
create table applications (
  id                  uuid primary key default gen_random_uuid(),
  req_id              uuid not null references reqs(id) on delete cascade,
  candidate_name      text not null,
  candidate_email     text not null,
  resume_storage_path text not null,
  status              text not null default 'new'
    check (status in ('new', 'shortlisted', 'rejected', 'saved')),
  submitted_at        timestamptz not null default now()
);

create index applications_req_id_idx  on applications(req_id);
create index applications_status_idx  on applications(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Scores — 1:1 with applications. Absence of row = "not scored yet" (TRD §4 note).
-- Shape mirrors Gemini's responseSchema (TRD §5).
-- ─────────────────────────────────────────────────────────────────────────────
create table scores (
  id                  uuid primary key default gen_random_uuid(),
  application_id      uuid not null unique references applications(id) on delete cascade,
  match_score         int  not null check (match_score between 0 and 100),
  must_have_checks    jsonb not null default '[]'::jsonb,
  nice_to_have_checks jsonb not null default '[]'::jsonb,
  strengths           text[] not null default '{}',
  gaps                text[] not null default '{}',
  summary             text not null,
  scored_at           timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- InterviewAssignments — HR assigns interviewer(s) + round_label to a shortlisted
-- application (PRD §6.2, TRD §7).
-- ─────────────────────────────────────────────────────────────────────────────
create table interview_assignments (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references applications(id) on delete cascade,
  interviewer_id  uuid not null references interviewers(id) on delete restrict,
  round_label     text not null,
  created_at      timestamptz not null default now(),
  unique (application_id, interviewer_id, round_label)
);

create index interview_assignments_application_id_idx on interview_assignments(application_id);
create index interview_assignments_interviewer_id_idx on interview_assignments(interviewer_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Scorecards — 1:1 with an assignment. Blind-until-submit is enforced at the
-- query layer (TRD §8): a scorecard is filtered out of an interviewer's view
-- of a candidate until they themselves have a row here.
-- ─────────────────────────────────────────────────────────────────────────────
create table scorecards (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null unique references interview_assignments(id) on delete cascade,
  ratings        jsonb not null default '{}'::jsonb,
  notes          text  not null default '',
  recommendation text  not null
    check (recommendation in ('strong_hire', 'hire', 'no_hire', 'strong_no_hire')),
  submitted_at   timestamptz not null default now()
);
