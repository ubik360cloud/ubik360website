-- Links imported contacts back to the Apollo plan that sourced them (a
-- "segment" is just an apollo_weekly_plans row -- it already carries a
-- label, a brief, and the exact filter used, so there's no need for a
-- separate segments table). Also links a flow to the plan it was drafted
-- for, so the Flows page can show which segment a flow targets and offer a
-- one-click "enroll this segment" action instead of enrolling contacts one
-- at a time.
alter table contacts add column source_plan_id uuid references apollo_weekly_plans (id);
create index contacts_source_plan_idx on contacts (source_plan_id) where source_plan_id is not null;

alter table flows add column source_plan_id uuid references apollo_weekly_plans (id);
