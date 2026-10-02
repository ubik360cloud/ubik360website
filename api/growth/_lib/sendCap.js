// Enforces the combined 10/day send cap (both tracks together) Jose set
// 2026-09. One row per UTC calendar date in daily_send_log, incremented
// atomically via Postgres so two concurrent sends can't both slip past 10.
import { supabase } from './supabase.js';

const DAILY_CAP = Number(process.env.GROWTH_DAILY_SEND_CAP || 10);

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Atomically reserves one send for today. Returns true if under cap (and
 *  the slot is now taken), false if the cap is already reached. */
export async function reserveSendSlot() {
  const date = today();
  const db = supabase();
  const { data, error } = await db.rpc('reserve_send_slot', { p_date: date, p_cap: DAILY_CAP });
  if (error) throw error;
  return Boolean(data);
}

export async function sendsRemainingToday() {
  const date = today();
  const db = supabase();
  const { data, error } = await db.from('daily_send_log').select('sent_count').eq('send_date', date).maybeSingle();
  if (error) throw error;
  const sent = data?.sent_count || 0;
  return Math.max(0, DAILY_CAP - sent);
}
