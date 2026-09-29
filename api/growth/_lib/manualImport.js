// Lets Jose import contacts he exported directly from Apollo's own
// platform -- 2026-09-29, after he found he can filter/segment better
// there directly than through our automated pipeline for now -- into a
// segment here, so a flow can still be built for them later. Reuses the
// exact same "segment == an apollo_weekly_plans row" model the automated
// pull already uses (see weeklyPlan.js / flowAssistant.js's own comments),
// just created directly instead of through a search+bulk_match pull. No
// Apollo API call happens here at all -- the hub parses the CSV client
// side and posts already-structured rows.
import { supabase } from './supabase.js';
import { currentWeekOf } from './weeklyPlan.js';

export async function importManualContacts({ track, planId, label, brief, contacts }) {
  if (track !== 'ic' && track !== 'b2b') throw new Error(`Invalid track '${track}'`);
  if (!Array.isArray(contacts) || !contacts.length) throw new Error('contacts array is required');

  const db = supabase();
  let plan;

  if (planId) {
    const { data, error } = await db.from('apollo_weekly_plans').select('*').eq('id', planId).single();
    if (error || !data) throw new Error('segment not found');
    if (data.track !== track) throw new Error(`That segment belongs to track '${data.track}', not '${track}'`);
    plan = data;
  } else {
    if (!label?.trim()) throw new Error('label is required to create a new segment');
    const week_of = currentWeekOf();

    // Idempotent per (track, week, label), same pattern as
    // proposeCustomPlan -- importing more rows under a label reused within
    // the same week adds to that segment instead of erroring on the
    // unique constraint.
    const { data: existing } = await db
      .from('apollo_weekly_plans')
      .select('*')
      .eq('track', track)
      .eq('week_of', week_of)
      .eq('label', label.trim())
      .maybeSingle();

    if (existing) {
      plan = existing;
    } else {
      const { data, error } = await db
        .from('apollo_weekly_plans')
        .insert({
          track,
          week_of,
          label: label.trim(),
          brief: brief || null,
          status: 'completed',
          filter: { manual: true },
          rationale: brief || `Manually imported from an Apollo export: ${label.trim()}`,
          counts: { imported: 0, target: contacts.length },
        })
        .select()
        .single();
      if (error) throw error;
      plan = data;
    }
  }

  let imported = 0, skipped = 0;
  for (const row of contacts) {
    const email = row.email?.trim().toLowerCase();
    if (!email) { skipped += 1; continue; }

    const { data: contact, error: cErr } = await db
      .from('contacts')
      .upsert(
        {
          email,
          first_name: row.first_name || null,
          last_name: row.last_name || null,
          title: row.title || null,
          company: row.company || null,
          company_domain: row.company_domain || null,
          city: row.city || null,
          state: row.state || null,
          country: row.country || null,
          linkedin_url: row.linkedin_url || null,
          track,
          source: 'manual_import',
          status: 'active',
          source_plan_id: plan.id,
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single();
    if (cErr || !contact) { skipped += 1; continue; }

    await db.from('leads').upsert({ contact_id: contact.id, track, stage: 'new' }, { onConflict: 'contact_id' });
    imported += 1;
  }

  const counts = { ...(plan.counts || {}), imported: (plan.counts?.imported || 0) + imported };
  const { data: updatedPlan, error: updateErr } = await db
    .from('apollo_weekly_plans')
    .update({ counts })
    .eq('id', plan.id)
    .select()
    .single();
  if (updateErr) throw updateErr;

  return { plan: updatedPlan, imported, skipped };
}
