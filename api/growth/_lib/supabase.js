// Server-side Supabase client for the growth-hub API routes — service role
// key, never exposed to the client. Separate Supabase project from
// 360PrintStudio's (same account, isolated project) -- see CLAUDE.md
// "Growth Hub (Apollo outreach)".
import { createClient } from '@supabase/supabase-js';

let _client = null;

export function supabase() {
  if (_client) return _client;
  const url = process.env.GROWTH_SUPABASE_URL;
  const key = process.env.GROWTH_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('GROWTH_SUPABASE_URL / GROWTH_SUPABASE_SERVICE_ROLE_KEY not set');
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
