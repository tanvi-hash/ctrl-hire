# Supabase — schema, migrations, seed

This folder is the single source of truth for the ATS Postgres schema plus the
demo seed. See TRD §4 (data model) and §9 (deployment).

## Layout

```
supabase/
├── migrations/
│   ├── 20260423120000_init_schema.sql   -- 6 tables + constraints + indexes
│   └── 20260423120001_init_storage.sql  -- private `resumes` bucket, 5 MiB PDF cap
└── seed.sql                              -- 3 interviewers, 1 req, 6 applications,
                                          --  6 scores, 1 assignment
```

## Apply (dashboard)

1. Open the Supabase project → **SQL Editor**.
2. Run the migrations in order (paste contents of each file).
3. Run `seed.sql` to populate demo data.

## Apply (CLI)

Requires the Supabase CLI locally.

```sh
supabase link --project-ref <your-ref>
supabase db push          # applies migrations/
psql "$DATABASE_URL" -f supabase/seed.sql
# or: supabase db reset   # wipes + re-applies migrations + re-runs seed.sql
```

## Notes

- **No RLS.** Per TRD §6, access isolation is enforced at the query layer only.
  MVP runs on a non-production URL with synthetic data.
- **`slug` on reqs.** Not in TRD §4 literally, but required by TRD §7 for
  `/apply/:req_slug` routing.
- **Resume files.** Seed rows reference `seed/*.pdf` paths that don't exist in
  Storage — HR's "View resume" action will 404 until real uploads land via the
  candidate intake flow (issue #4).
- **IDs in seed are deterministic.** Interviewers use the `10000000-…` prefix,
  reqs `20000000-…`, applications `30000000-…`, scores `40000000-…`,
  assignments `50000000-…`. Keeps cross-references readable.
