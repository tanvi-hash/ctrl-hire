-- Internal ATS — add a free-form `profile` payload on scores.
-- Gemini extracts lightweight resume facts (company/title/location/yoe/phone)
-- when they're present. Absent fields stay absent. Backward-compatible:
-- the column is NOT NULL with a '{}' default so existing rows work unchanged.

alter table scores
  add column if not exists profile jsonb not null default '{}'::jsonb;
