-- Supports multiple, concurrently-running, manually-targeted Apollo plans
-- per (track, week) alongside the single automated weekly plan -- e.g. two
-- test campaigns ("canada-outsourcing-staffing-test",
-- "colombia-ai-automation-test") in the same week for the same track.
-- `label` defaults to '' for the standard automated weekly plan so its old
-- one-per-(track,week) uniqueness behavior is unchanged; custom plans supply
-- a real label. `brief` records the human context/reasoning behind a custom
-- plan's filter (geography, industry, positioning angle) for future
-- reference and per-campaign performance comparison.
alter table apollo_weekly_plans drop constraint apollo_weekly_plans_track_week_of_key;
alter table apollo_weekly_plans add column label text not null default '';
alter table apollo_weekly_plans add column brief text;
alter table apollo_weekly_plans add constraint apollo_weekly_plans_track_week_of_label_key unique (track, week_of, label);
