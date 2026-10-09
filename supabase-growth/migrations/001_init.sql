-- Ubik 360 growth-hub — initial schema
-- Two tracks share every table ('ic' = Jose's independent-contractor outreach,
-- 'b2b' = Ubik 360's own outreach) rather than duplicating structure, mirroring
-- how 360PrintStudio's marketing-hub keeps one channel-agnostic model per
-- concern instead of parallel schemas per persona.

create type growth_track as enum ('ic', 'b2b');
create type contact_status as enum ('active', 'unsubscribed', 'bounced', 'complained');
create type lead_stage as enum (
  'new', 'contacted', 'engaged', 'replied', 'in_conversation', 'won', 'lost', 'disqualified'
);
create type flow_status as enum ('draft', 'active', 'paused');
create type enrollment_status as enum ('active', 'completed', 'paused', 'stopped');
create type weekly_plan_status as enum (
  'proposed', 'approved', 'pulling', 'staged', 'enrolling', 'completed'
);
create type staging_status as enum ('pending', 'imported', 'rejected');
create type oneoff_status as enum ('pending', 'approved', 'rejected', 'sent');
create type email_event_type as enum (
  'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'complained', 'unsubscribed'
);

-- ── Contacts (the email projection; one row per email address) ──────────────
create table contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text,
  last_name text,
  title text,
  company text,
  company_domain text,
  linkedin_url text,
  city text,
  state text,
  country text,
  track growth_track not null,
  source text not null default 'apollo',       -- 'apollo' | 'manual'
  apollo_id text,
  status contact_status not null default 'active',
  do_not_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contacts_track_idx on contacts (track);
create index contacts_apollo_id_idx on contacts (apollo_id) where apollo_id is not null;

-- ── Leads (the Kanban — one per contact, tracks the relationship) ───────────
create table leads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  track growth_track not null,
  stage lead_stage not null default 'new',
  fit_score text,                               -- 'strong' | 'possible' (from research verdict)
  owner text,
  notes text,
  next_action text,
  next_action_due date,
  first_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contact_id)
);
create index leads_stage_idx on leads (stage);
create index leads_track_idx on leads (track);

create table lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  event_type text not null,                     -- stage_change | note | owner_assigned
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ── Flows / steps / enrollments (the sequencer) ──────────────────────────────
create table flows (
  id uuid primary key default gen_random_uuid(),
  track growth_track not null,
  name text not null,
  description text,
  status flow_status not null default 'draft',
  send_window jsonb,                            -- {"start_hour":9,"end_hour":17,"days":[1,2,3,4,5]}
  per_contact_min_gap_hours integer not null default 48,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table flow_steps (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references flows (id) on delete cascade,
  step_no integer not null,
  delay_hours integer not null default 0,        -- delay after previous step (0 for step 1)
  subject text not null,
  body text not null,                            -- plain text; CTA appended if cta_url set
  cta_url text,
  is_active boolean not null default true,
  unique (flow_id, step_no)
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references flows (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  status enrollment_status not null default 'active',
  current_step integer not null default 0,       -- 0 = not yet sent step 1
  next_send_at timestamptz,
  enrolled_at timestamptz not null default now(),
  enrolled_by text,
  completed_at timestamptz,
  unique (flow_id, contact_id)
);
create index enrollments_due_idx on enrollments (next_send_at) where status = 'active';

-- ── Apollo weekly-plan loop (propose -> approve -> stage -> import) ─────────
create table apollo_weekly_plans (
  id uuid primary key default gen_random_uuid(),
  track growth_track not null,
  week_of date not null,
  status weekly_plan_status not null default 'proposed',
  filter jsonb not null,
  flow_id uuid references flows (id),
  rationale text,
  counts jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (track, week_of)
);

create table apollo_staging (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null references apollo_weekly_plans (id) on delete cascade,
  apollo_id text not null,
  payload jsonb not null,
  email text not null,
  first_name text,
  last_name text,
  title text,
  company text,
  company_domain text,
  city text,
  state text,
  country text,
  linkedin_url text,
  status staging_status not null default 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  imported_contact_id uuid references contacts (id),
  created_at timestamptz not null default now(),
  unique (apollo_id)
);

-- ── 1:1 research + draft queue (AI-researched, human-approved) ──────────────
create table oneoffs (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  track growth_track not null,
  research jsonb,                                -- full verdict object from prospectResearch
  subject text,
  body text,
  status oneoff_status not null default 'pending',
  approved_at timestamptz,
  approved_by text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index oneoffs_status_idx on oneoffs (status);

-- ── Deliverability / compliance ──────────────────────────────────────────────
create table email_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts (id) on delete set null,
  track growth_track,
  direction text not null default 'outbound',    -- 'outbound' | 'inbound'
  event_type email_event_type not null,
  source text,                                    -- 'flow' | 'oneoff'
  meta jsonb,
  created_at timestamptz not null default now()
);
create index email_events_created_idx on email_events (created_at);
create index email_events_contact_idx on email_events (contact_id);

create table suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  reason text not null,                           -- 'unsubscribed' | 'bounced' | 'complained' | 'manual'
  created_at timestamptz not null default now()
);

-- Simple daily send counter, enforced at the application layer (cap = 10/day
-- combined across tracks, per Jose 2026-09). One row per calendar date (UTC).
create table daily_send_log (
  send_date date primary key,
  sent_count integer not null default 0
);

-- updated_at bookkeeping (mirrors the pattern used elsewhere, avoids relying on
-- every call site remembering to set it)
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contacts_set_updated_at before update on contacts
  for each row execute function set_updated_at();
create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();
create trigger flows_set_updated_at before update on flows
  for each row execute function set_updated_at();
create trigger apollo_weekly_plans_set_updated_at before update on apollo_weekly_plans
  for each row execute function set_updated_at();

-- Atomically reserves one send against the daily cap (both tracks share one
-- counter). Returns true and increments if under cap, false (no increment)
-- if the cap is already reached -- upsert + row lock makes this safe against
-- concurrent callers, which matters once the flow runner and the 1:1 send
-- endpoint can both fire close together.
create or replace function reserve_send_slot(p_date date, p_cap integer)
returns boolean as $$
declare
  current_count integer;
begin
  insert into daily_send_log (send_date, sent_count) values (p_date, 0)
    on conflict (send_date) do nothing;

  select sent_count into current_count from daily_send_log where send_date = p_date for update;

  if current_count >= p_cap then
    return false;
  end if;

  update daily_send_log set sent_count = sent_count + 1 where send_date = p_date;
  return true;
end;
$$ language plpgsql;
