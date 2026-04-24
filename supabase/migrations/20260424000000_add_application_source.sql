-- CLAUDE.md invariant #7: source tag is mandatory from first touch.
-- Every application URL carries ?source=<tag>; capture it at ingest so
-- source-of-hire tracking is possible downstream.

alter table applications
  add column source text;

-- Index the column so HR dashboards can group/filter by channel without a seq scan.
create index if not exists applications_source_idx on applications (source);
