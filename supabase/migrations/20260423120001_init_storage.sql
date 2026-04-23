-- Internal ATS — storage
-- Spec: docs/ats_trd.md §9 ("one Supabase Storage bucket, `resumes`, private;
-- served via signed URLs") and §10 (5 MB resume file cap).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  5242880, -- 5 MiB per TRD §10
  array['application/pdf']
)
on conflict (id) do nothing;
