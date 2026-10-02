-- Apollo already returns company_size/industry/founded_year in every
-- search/match response (apollo_staging.payload->organization), but it was
-- being discarded at the contacts insert step. Added so 1:1 drafting can
-- write from structured firmographic facts instead of scraping/reading the
-- prospect's own website -- see prospectResearch.js's rewrite, 2026-10-02.
alter table contacts add column company_size integer;
alter table contacts add column industry text;
alter table contacts add column founded_year integer;
