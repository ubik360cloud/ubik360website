-- Row Level Security lockdown. No policies added deliberately -- every
-- table is accessed exclusively through the backend's service-role key
-- (api/growth/_lib/supabase.js), never directly from the hub app's anon
-- key. RLS-enabled + zero policies = anon/authenticated get nothing,
-- service_role is unaffected (it bypasses RLS entirely). Flagged by
-- Supabase's own security advisor (critical) right after 001_init and
-- applied 2026-09-22 once Jose confirmed.
ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lead_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."flow_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."apollo_weekly_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."apollo_staging" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."oneoffs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."suppressions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."daily_send_log" ENABLE ROW LEVEL SECURITY;
