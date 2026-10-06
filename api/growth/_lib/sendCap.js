// Daily send limits. 2026-10-06 (Jose): SendGrid's free tier allows 100/day,
// so the old flat 10/day combined cap is replaced by two layers:
//   - TOTAL_CAP (100): everything together, enforced atomically via Postgres
//     (one row per UTC date in daily_send_log) so concurrent sends can't both
//     slip past it.
//   - ONEOFF_CAP (10): the most 1:1 drafts he can send in a day -- a human
//     workflow limit, not a deliverability one.
// Flows get whatever the total has left when the flow runner fires (see
// flowEngine.js's runDueSteps, which splits it evenly across active flows).
// The old GROWTH_DAILY_SEND_CAP env var (10) is intentionally no longer read.
import { supabase } from './supabase.js';

const TOTAL_CAP = Number(process.env.GROWTH_DAILY_TOTAL_CAP || 100);
const ONEOFF_CAP = Number(process.env.GROWTH_DAILY_ONEOFF_CAP || 10);

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function oneoffSentToday() {
  const { count, error } = await supabase()
    .from('email_events')
    .select('id', { count: 'exact', head: true })
    .eq('source', 'oneoff')
    .eq('event_type', 'sent')
    .gte('created_at', `${today()}T00:00:00Z`);
  if (error) throw error;
  return count || 0;
}

/** Atomically reserves one send for today. `kind` is 'oneoff' or 'flow'.
 *  Returns true if allowed (and the slot is now taken), false if a cap is
 *  already reached. */
export async function reserveSendSlot({ kind = 'flow' } = {}) {
  if (kind === 'oneoff' && (await oneoffSentToday()) >= ONEOFF_CAP) return false;
  const { data, error } = await supabase().rpc('reserve_send_slot', { p_date: today(), p_cap: TOTAL_CAP });
  if (error) throw error;
  return Boolean(data);
}

export async function sendsRemainingToday() {
  const { data, error } = await supabase().from('daily_send_log').select('sent_count').eq('send_date', today()).maybeSingle();
  if (error) throw error;
  return Math.max(0, TOTAL_CAP - (data?.sent_count || 0));
}

/** Everything the dashboard needs about today's sending in one call. */
export async function sendStatusToday() {
  const { data, error } = await supabase().from('daily_send_log').select('sent_count').eq('send_date', today()).maybeSingle();
  if (error) throw error;
  const sentTotal = data?.sent_count || 0;
  const oneoffSent = await oneoffSentToday();
  return {
    totalCap: TOTAL_CAP,
    sentTotal,
    remaining: Math.max(0, TOTAL_CAP - sentTotal),
    oneoffCap: ONEOFF_CAP,
    oneoffSent,
    flowSent: Math.max(0, sentTotal - oneoffSent),
  };
}
