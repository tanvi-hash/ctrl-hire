-- Internal ATS — demo seed
-- Loaded automatically on `supabase db reset`. Idempotent via ON CONFLICT.
-- Candidate profiles mirror design-explorations/_data.js so built screens
-- render against a familiar dataset.

-- ─────────────────────────────────────────────────────────────────────────────
-- Interviewers — 3 people, deterministic IDs for stable references.
-- ─────────────────────────────────────────────────────────────────────────────
insert into interviewers (id, name, email) values
  ('10000000-0000-0000-0000-000000000001', 'Ameya Rao',      'ameya@vymo.test'),
  ('10000000-0000-0000-0000-000000000002', 'Dev Kapoor',     'dev@vymo.test'),
  ('10000000-0000-0000-0000-000000000003', 'Rekha Menon',    'rekha@vymo.test')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Reqs — one published role. Rubric matches the spec used in the exploration.
-- ─────────────────────────────────────────────────────────────────────────────
insert into reqs (id, slug, title, role_family, must_haves, nice_to_haves, focus_attributes) values
  (
    '20000000-0000-0000-0000-000000000001',
    'senior-frontend-engineer',
    'Senior Frontend Engineer',
    'Engineering',
    array[
      'React (3+ yrs)',
      'TypeScript',
      'Modern framework (Next.js / Remix)',
      'Production-scale experience',
      'Designer collaboration'
    ],
    array[
      'Design systems',
      'Performance',
      'Accessibility',
      'Testing depth',
      'Mentoring'
    ],
    array[
      'Systems thinking',
      'Code quality',
      'Collaboration',
      'Product sense'
    ]
  )
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Applications — 6 candidates spanning the score range.
-- ─────────────────────────────────────────────────────────────────────────────
insert into applications
  (id, req_id, candidate_name, candidate_email, resume_storage_path, status, submitted_at) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   'Priya Ramaswamy', 'priya.ramaswamy@gmail.com', 'seed/priya-ramaswamy.pdf',
   'shortlisted', now() - interval '2 days'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
   'Arjun Shetty',    'arjun.s@protonmail.com',   'seed/arjun-shetty.pdf',
   'new',         now() - interval '3 days'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
   'Mei Lin Tan',     'meilin@hey.com',           'seed/mei-lin-tan.pdf',
   'new',         now() - interval '1 day'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001',
   'Daniel Okafor',   'd.okafor@fastmail.com',    'seed/daniel-okafor.pdf',
   'new',         now() - interval '4 days'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001',
   'Ananya Iyer',     'ananya.iyer17@outlook.com','seed/ananya-iyer.pdf',
   'saved',       now() - interval '2 days'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001',
   'Tomás Herrera',   'tomas.herrera@gmail.com',  'seed/tomas-herrera.pdf',
   'new',         now() - interval '5 days')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Scores — 1:1 with applications. Shape matches Gemini's responseSchema (TRD §5).
-- ─────────────────────────────────────────────────────────────────────────────
insert into scores
  (id, application_id, match_score, must_have_checks, nice_to_have_checks, strengths, gaps, summary) values
  (
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    92,
    '[
      {"requirement":"React (3+ yrs)","met":true,"evidence":"7 yrs React at Razorpay; authored team style guide."},
      {"requirement":"TypeScript","met":true,"evidence":"TS since 2019; strict mode evangelist."},
      {"requirement":"Modern framework (Next.js / Remix)","met":true,"evidence":"Led checkout migration to Next.js App Router."},
      {"requirement":"Production-scale experience","met":true,"evidence":"Owned checkout serving 3M+ transactions/day."},
      {"requirement":"Designer collaboration","met":true,"evidence":"Built Razorpay Blade design system with 4 product teams."}
    ]'::jsonb,
    '[
      {"requirement":"Design systems","met":true,"evidence":"Blade — 60+ components adopted org-wide."},
      {"requirement":"Performance","met":true,"evidence":"Drove 40% perf gain on checkout."},
      {"requirement":"Accessibility","met":false,"evidence":"No WCAG / a11y work called out."},
      {"requirement":"Testing depth","met":false,"evidence":"Jest mentioned; no integration / e2e depth."},
      {"requirement":"Mentoring","met":false,"evidence":"IC-framed resume; no leadership of juniors."}
    ]'::jsonb,
    array[
      'Deep React + TypeScript — 7 yrs React, TS since 2019; authored internal style guide.',
      'Design systems leader — built Razorpay Blade, 60+ components across 4 product teams.',
      'Production scale — owned checkout serving 3M+ transactions/day.'
    ],
    array[
      'No Remix exposure — Next.js only; our team uses both.',
      'Light testing signal — Jest mentioned; no integration / e2e depth.',
      'No explicit mentoring — IC-framed resume.'
    ],
    'Led checkout migration to Next.js, drove 40% perf gain, built Razorpay''s design system (Blade).'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    88,
    '[
      {"requirement":"React (3+ yrs)","met":true,"evidence":"6 yrs React at Swiggy."},
      {"requirement":"TypeScript","met":true,"evidence":"TS across Swiggy web codebase."},
      {"requirement":"Modern framework (Next.js / Remix)","met":true,"evidence":"Migrated Swiggy web from CRA to Next.js App Router."},
      {"requirement":"Production-scale experience","met":true,"evidence":"Swiggy listings — heavy consumer traffic."},
      {"requirement":"Designer collaboration","met":true,"evidence":"Shipped major design overhauls with design team."}
    ]'::jsonb,
    '[
      {"requirement":"Design systems","met":false,"evidence":"Contributor role, not owner."},
      {"requirement":"Performance","met":true,"evidence":"LCP 4.1 → 1.8s on Swiggy listings; authored team perf playbook."},
      {"requirement":"Accessibility","met":false,"evidence":"No WCAG / ARIA mentions."},
      {"requirement":"Testing depth","met":true,"evidence":"Vitest-first team; 70% coverage on core flows."},
      {"requirement":"Mentoring","met":false,"evidence":"No leadership of juniors called out."}
    ]'::jsonb,
    array[
      'Performance expert — LCP 4.1 → 1.8s on Swiggy listings; authored perf playbook.',
      'Next.js production depth — migrated Swiggy web from CRA to App Router.',
      'TS + testing culture — Vitest-first team; 70% coverage on core flows.'
    ],
    array[
      'Not a design-system owner — contributor, not lead.',
      'Limited a11y signal — no WCAG / ARIA mentions.',
      'No mentoring track record.'
    ],
    'Owned Swiggy web perf — reduced LCP from 4.1s to 1.8s across restaurant listing flow.'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    85,
    '[
      {"requirement":"React (3+ yrs)","met":true,"evidence":"5 yrs React at Stripe."},
      {"requirement":"TypeScript","met":true,"evidence":"Contributed to Stripe internal TS linting ruleset."},
      {"requirement":"Modern framework (Next.js / Remix)","met":true,"evidence":"Shipped in both Remix (Stripe Docs) and Next (Checkout)."},
      {"requirement":"Production-scale experience","met":true,"evidence":"Stripe Checkout — global payment traffic."},
      {"requirement":"Designer collaboration","met":true,"evidence":"Partnered with design on 14 payment flows."}
    ]'::jsonb,
    '[
      {"requirement":"Design systems","met":false,"evidence":"Consumer of Stripe''s system; didn''t build one."},
      {"requirement":"Performance","met":true,"evidence":"Owned Core Web Vitals work on Checkout."},
      {"requirement":"Accessibility","met":true,"evidence":"Led WCAG 2.2 AA conformance across 14 flows."},
      {"requirement":"Testing depth","met":true,"evidence":"Test-first team culture."},
      {"requirement":"Mentoring","met":false,"evidence":"IC role; not led multi-team initiatives."}
    ]'::jsonb,
    array[
      'Accessibility depth — led WCAG 2.2 AA project on Stripe Checkout (14 flows).',
      'Rigorous TS — contributed to internal TS linting ruleset; strict-mode evangelist.',
      'Framework breadth — shipped in both Remix and Next in production.'
    ],
    array[
      'Smaller ownership scale — IC, not multi-team lead.',
      'No design-system creation — consumer, not author.',
      'Timezone — Singapore is +2.5h on Bangalore; workable but not stated.'
    ],
    'Accessibility lead on Stripe Checkout; shipped WCAG 2.2 AA across 14 payment flows.'
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000004',
    83,
    '[
      {"requirement":"React (3+ yrs)","met":true,"evidence":"6 yrs React at Monzo."},
      {"requirement":"TypeScript","met":true,"evidence":"Strong TS culture at Monzo."},
      {"requirement":"Modern framework (Next.js / Remix)","met":true,"evidence":"Monzo internal tools run on Remix."},
      {"requirement":"Production-scale experience","met":false,"evidence":"Internal tooling, not consumer-facing scale."},
      {"requirement":"Designer collaboration","met":true,"evidence":"Shipped 12 features with design across 2 years."}
    ]'::jsonb,
    '[
      {"requirement":"Design systems","met":false,"evidence":"Consumer, not author."},
      {"requirement":"Performance","met":false,"evidence":"Not a focus area."},
      {"requirement":"Accessibility","met":true,"evidence":"Strong a11y discipline on internal platform."},
      {"requirement":"Testing depth","met":true,"evidence":"Playwright champion; 85%+ coverage on owned code."},
      {"requirement":"Mentoring","met":true,"evidence":"Led 3 juniors to mid-level; authored FE onboarding."}
    ]'::jsonb,
    array[
      'Mentoring + leadership — led 3 juniors to mid-level; authored Monzo''s FE onboarding.',
      'Testing discipline — Playwright champion; 85%+ coverage on owned code.',
      'Sustained design partnership — 12 features with design across 2 years.'
    ],
    array[
      'No consumer-scale product — internal tools, not public-facing.',
      'Next.js limited — Monzo tools use Remix; Next only in personal projects.',
      'Timezone — London is 5h offset from Bangalore.'
    ],
    'Built Monzo''s internal tooling platform; mentored 3 juniors through career progression.'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    '30000000-0000-0000-0000-000000000005',
    79,
    '[
      {"requirement":"React (3+ yrs)","met":true,"evidence":"4 yrs React at Unacademy."},
      {"requirement":"TypeScript","met":false,"evidence":"Migrated mid-career; TS depth less than 3 yrs."},
      {"requirement":"Modern framework (Next.js / Remix)","met":true,"evidence":"Next.js in production at Unacademy."},
      {"requirement":"Production-scale experience","met":true,"evidence":"Live-class serves 500k+ concurrent students."},
      {"requirement":"Designer collaboration","met":true,"evidence":"Animation-heavy work partnered with design."}
    ]'::jsonb,
    '[
      {"requirement":"Design systems","met":false,"evidence":"Built features, not foundation."},
      {"requirement":"Performance","met":true,"evidence":"Realtime video sync required perf discipline."},
      {"requirement":"Accessibility","met":false,"evidence":"Not called out on resume."},
      {"requirement":"Testing depth","met":false,"evidence":"Not a focus area."},
      {"requirement":"Mentoring","met":false,"evidence":"IC focus only."}
    ]'::jsonb,
    array[
      'Animation craft — complex live-class video UI with Framer Motion choreography.',
      'Shipped at scale — live-class serves 500k+ concurrent students.',
      'Strong React intuition — custom hooks for realtime video sync.'
    ],
    array[
      'TS only 2 years — under bar on depth.',
      'No design-system work — built features, not foundation.',
      'No mentoring signal.'
    ],
    'Motion + animation specialist; built Unacademy''s live-class video UI with React + Framer Motion.'
  ),
  (
    '40000000-0000-0000-0000-000000000006',
    '30000000-0000-0000-0000-000000000006',
    76,
    '[
      {"requirement":"React (3+ yrs)","met":true,"evidence":"5 yrs React at Mercado Libre."},
      {"requirement":"TypeScript","met":false,"evidence":"JS codebase primarily; TS on personal projects only."},
      {"requirement":"Modern framework (Next.js / Remix)","met":true,"evidence":"ML checkout on modern React stack."},
      {"requirement":"Production-scale experience","met":true,"evidence":"ML checkout — LatAm-wide commerce scale."},
      {"requirement":"Designer collaboration","met":true,"evidence":"Standard at ML."}
    ]'::jsonb,
    '[
      {"requirement":"Design systems","met":false,"evidence":"Consumer of ML''s Andes, not author."},
      {"requirement":"Performance","met":true,"evidence":"Owned Core Web Vitals for ML checkout web."},
      {"requirement":"Accessibility","met":false,"evidence":"Not called out."},
      {"requirement":"Testing depth","met":false,"evidence":"Not a focus area."},
      {"requirement":"Mentoring","met":false,"evidence":"Not called out."}
    ]'::jsonb,
    array[
      'Cross-platform React — shared codebase across RN and Web at ML checkout.',
      'Performance discipline — owned Core Web Vitals for ML checkout web.',
      'Payment domain — 3 yrs in payments specifically; direct relevance.'
    ],
    array[
      'Weak TS signal — JS codebase primarily.',
      'No design-system ownership — consumer, not author.',
      'Timezone — 9.5h offset from Bangalore.'
    ],
    'React Native + Web shared-codebase owner at Mercado Libre checkout team.'
  )
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- One interview assignment — Priya (shortlisted) → Ameya, "Screen" round.
-- Intentionally no scorecard yet, so the interviewer queue shows a pending item
-- and blind-until-submit has a testable starting state.
-- ─────────────────────────────────────────────────────────────────────────────
insert into interview_assignments (id, application_id, interviewer_id, round_label) values
  (
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Screen'
  )
on conflict (id) do nothing;
