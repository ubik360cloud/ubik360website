// The weekly Apollo propose -> approve -> stage -> import loop, one plan per
// track per week. Directly adapted from 360PrintStudio's apolloSync.js --
// same two-endpoint-in-order Apollo pattern (free search, then paid
// bulk_match only for new ids), same "only verified emails, never
// auto-send" discipline. Scaled down: this system caps at 10 sends/day
// combined, so a small weekly pull (default 20/track) is plenty of input --
// no reason to spend Apollo credits pulling hundreds of contacts that would
// just sit unsent for weeks.
import { supabase } from './supabase.js';
import { apolloFetch } from './apollo.js';

const WEEKLY_TARGET = Number(process.env.GROWTH_APOLLO_WEEKLY_TARGET || 20);
const MAX_PAGES = 5;

// Apollo's real, documented mixed_people/api_search parameters (verified
// 2026-09 against docs.apollo.io -- note there is NO buying-intent/topic
// parameter on this endpoint, despite Apollo's product having an "Intent"
// feature elsewhere; don't invent one). "Actively hiring for X" via
// q_organization_job_titles/organization_num_jobs_range is the closest real
// proxy signal available here, per Jose 2026-09. Whitelisted (not just
// spread) so a plan's filter object can carry bookkeeping fields (target,
// persona_key, persona_label) without them leaking into the Apollo request.
const APOLLO_SEARCH_KEYS = [
  'person_titles', 'include_similar_titles', 'person_seniorities', 'person_locations',
  'q_organization_domains_list', 'organization_locations', 'organization_ids',
  'organization_num_employees_ranges', 'revenue_range', 'organization_num_jobs_range',
  'organization_job_posted_at_range', 'organization_headcount_growth_past_n_months',
  'organization_headcount_growth_range', 'not_organization_websites_list',
  'currently_using_any_of_technology_uids', 'currently_using_all_of_technology_uids',
  'currently_not_using_any_of_technology_uids', 'q_organization_job_titles',
  'organization_job_locations', 'q_keywords', 'q_organization_keyword_tags',
];

function buildSearchBody(filter) {
  const body = {};
  for (const key of APOLLO_SEARCH_KEYS) {
    if (filter?.[key] !== undefined) body[key] = filter[key];
  }
  return body;
}

// One filter set per track -- see positioning/{track}.md for the pitch each
// of these feeds. Kept here (not in the DB) so a filter change is a code
// review, same reasoning 360PrintStudio's PERSONAS array uses.
const TRACK_FILTERS = {
  ic: {
    person_titles: ['founder', 'ceo', 'co-founder', 'president', 'head of ecommerce', 'director of ecommerce'],
    q_organization_keyword_tags: ['ecommerce', 'direct to consumer', 'amazon seller'],
    person_locations: ['United States'],
  },
  b2b: {
    person_titles: ['founder', 'ceo', 'owner', 'president', 'general manager'],
    q_organization_keyword_tags: ['small business', 'growth stage company'],
    person_locations: ['United States', 'Canada'],
  },
};

function currentWeekOf() {
  const et = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  et.setDate(et.getDate() + diffToMonday);
  et.setHours(0, 0, 0, 0);
  return et.toLocaleDateString('en-CA');
}

/** Idempotent per (track, calendar week) -- returns the existing plan if one
 *  already exists for this track+week rather than creating a duplicate. */
export async function proposeWeeklyPlan(track) {
  if (!TRACK_FILTERS[track]) throw new Error(`Invalid track '${track}'`);
  const db = supabase();
  const week_of = currentWeekOf();

  const { data: existing } = await db
    .from('apollo_weekly_plans')
    .select('*')
    .eq('track', track)
    .eq('week_of', week_of)
    .eq('label', '')
    .maybeSingle();
  if (existing) return existing;

  const { data: flow } = await db
    .from('flows')
    .select('id')
    .eq('track', track)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: plan, error } = await db
    .from('apollo_weekly_plans')
    .insert({
      track,
      week_of,
      status: 'proposed',
      filter: { ...TRACK_FILTERS[track], target: WEEKLY_TARGET },
      flow_id: flow?.id || null,
      rationale: `Weekly Apollo pull for the ${track} track, target ~${WEEKLY_TARGET} verified contacts.`,
      counts: { target: WEEKLY_TARGET },
    })
    .select()
    .single();
  if (error) throw error;
  return plan;
}

/** Creates a one-off, manually-targeted campaign alongside the standard
 *  automated weekly plan -- multiple can coexist per track per week, each
 *  with its own label (shows up as its own card in the hub's Apollo tab)
 *  and a free-text brief recording the human context/reasoning behind the
 *  filter (geography, industry, positioning angle) for future reference and
 *  per-campaign performance comparison. `filter` should use real Apollo
 *  mixed_people/api_search parameter names -- see APOLLO_SEARCH_KEYS. */
export async function proposeCustomPlan({ track, label, brief, filter, target }) {
  if (!TRACK_FILTERS[track] && track !== 'ic' && track !== 'b2b') throw new Error(`Invalid track '${track}'`);
  if (!label) throw new Error('label is required for a custom plan');
  const db = supabase();
  const week_of = currentWeekOf();

  const { data: existing } = await db
    .from('apollo_weekly_plans')
    .select('*')
    .eq('track', track)
    .eq('week_of', week_of)
    .eq('label', label)
    .maybeSingle();
  if (existing) return existing;

  const { data: plan, error } = await db
    .from('apollo_weekly_plans')
    .insert({
      track,
      week_of,
      label,
      brief: brief || null,
      status: 'proposed',
      filter: { ...filter, target },
      rationale: brief || `Custom pull: ${label}`,
      counts: { target },
    })
    .select()
    .single();
  if (error) throw error;
  return plan;
}

/** Search + bulk_match + stage. Small enough (target ~20) to run inline
 *  within a single serverless invocation -- no fire-and-forget needed at
 *  this volume, unlike 360PrintStudio's ~600/week pull. */
export async function pullApolloForPlan(planId) {
  const db = supabase();
  const { data: plan, error: loadErr } = await db.from('apollo_weekly_plans').select('*').eq('id', planId).single();
  if (loadErr || !plan) throw new Error('weekly plan not found');

  await db.from('apollo_weekly_plans').update({ status: 'pulling' }).eq('id', planId);

  const target = plan.filter?.target || WEEKLY_TARGET;
  const searchBody = buildSearchBody(plan.filter);

  const [{ data: existingContacts }, { data: existingStaging }] = await Promise.all([
    db.from('contacts').select('email'),
    db.from('apollo_staging').select('apollo_id, email'),
  ]);
  const haveEmails = new Set([
    ...(existingContacts || []).map((c) => c.email?.toLowerCase()).filter(Boolean),
    ...(existingStaging || []).map((c) => c.email?.toLowerCase()).filter(Boolean),
  ]);
  const haveApolloIds = new Set((existingStaging || []).map((c) => c.apollo_id).filter(Boolean));

  const candidateIds = [];
  let page = 1;
  while (candidateIds.length < target * 2 && page <= MAX_PAGES) {
    let res;
    try {
      res = await apolloFetch('/mixed_people/api_search', { ...searchBody, page });
    } catch (e) {
      console.error('[weeklyPlan] search page failed:', e.message);
      break;
    }
    const people = res.people || [];
    if (!people.length) break;
    for (const p of people) if (!haveApolloIds.has(p.id)) candidateIds.push(p.id);
    if (page * 50 >= (res.total_entries || 0)) break;
    page += 1;
  }

  let bulkMatched = 0;
  let withEmail = 0;
  const toInsert = [];
  for (let i = 0; i < candidateIds.length && withEmail < target; i += 10) {
    const batch = candidateIds.slice(i, i + 10);
    let res;
    try {
      res = await apolloFetch('/people/bulk_match?reveal_personal_emails=false&reveal_phone_number=false', {
        details: batch.map((id) => ({ id })),
      });
    } catch (e) {
      console.error('[weeklyPlan] bulk_match batch failed:', e.message);
      continue;
    }
    bulkMatched += (res.matches || []).length;
    for (const m of res.matches || []) {
      if (!m.email || m.email_status !== 'verified') continue;
      const emailLower = m.email.toLowerCase();
      if (haveEmails.has(emailLower)) continue;
      haveEmails.add(emailLower);
      withEmail += 1;
      toInsert.push({
        apollo_id: m.id,
        payload: m,
        email: m.email,
        first_name: m.first_name || null,
        last_name: m.last_name || null,
        title: m.title || null,
        company: m.organization?.name || null,
        company_domain: m.organization?.primary_domain || null,
        city: m.city || null,
        state: m.state || null,
        country: m.country || null,
        linkedin_url: m.linkedin_url || null,
        status: 'pending',
        weekly_plan_id: planId,
      });
    }
  }

  if (toInsert.length) {
    const { error: insErr } = await db.from('apollo_staging').upsert(toInsert, { onConflict: 'apollo_id', ignoreDuplicates: true });
    if (insErr) console.error('[weeklyPlan] staging insert failed:', insErr.message);
  }

  const counts = { ...(plan.counts || {}), target, searched: candidateIds.length, bulk_matched: bulkMatched, staged: toInsert.length };
  await db.from('apollo_weekly_plans').update({ status: 'staged', counts }).eq('id', planId);
  return counts;
}

export async function approvePlan(planId, { by = 'owner' } = {}) {
  const db = supabase();
  const { data: plan, error } = await db.from('apollo_weekly_plans').select('*').eq('id', planId).single();
  if (error || !plan) throw new Error('weekly plan not found');
  if (plan.status !== 'proposed') throw new Error(`plan is '${plan.status}', not 'proposed'`);

  const { data: updated, error: upErr } = await db
    .from('apollo_weekly_plans')
    .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: by })
    .eq('id', planId)
    .select()
    .single();
  if (upErr) throw upErr;

  await pullApolloForPlan(planId);
  return updated;
}

/** Imports approved staged contacts -> contacts + leads. Does NOT
 *  auto-enroll into a flow (unlike 360PrintStudio) -- this system's primary
 *  send path today is the 1:1 draft queue (dailyOneoffPull draws from
 *  `leads` where source='apollo'), so importing is enough; flow enrollment
 *  stays an explicit separate action once a flow exists and is approved. */
export async function stageApprove(planId, { excludeIds = [], by = 'owner' } = {}) {
  const db = supabase();
  const { data: plan, error } = await db.from('apollo_weekly_plans').select('*').eq('id', planId).single();
  if (error || !plan) throw new Error('weekly plan not found');

  const { data: staged, error: stErr } = await db
    .from('apollo_staging')
    .select('*')
    .eq('weekly_plan_id', planId)
    .eq('status', 'pending');
  if (stErr) throw stErr;

  const excludeSet = new Set(excludeIds);
  const toReject = (staged || []).filter((s) => excludeSet.has(s.id));
  const toImport = (staged || []).filter((s) => !excludeSet.has(s.id));

  if (toReject.length) {
    await db.from('apollo_staging').update({ status: 'rejected', reviewed_by: by, reviewed_at: new Date().toISOString() }).in('id', toReject.map((s) => s.id));
  }

  let imported = 0;
  for (const s of toImport) {
    const { data: contact, error: cErr } = await db
      .from('contacts')
      .upsert(
        {
          email: s.email, first_name: s.first_name, last_name: s.last_name,
          title: s.title, company: s.company, company_domain: s.company_domain,
          city: s.city, state: s.state, country: s.country || 'US',
          linkedin_url: s.linkedin_url, apollo_id: s.apollo_id,
          track: plan.track, source: 'apollo', status: 'active',
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single();
    if (cErr || !contact) continue;

    await db.from('leads').upsert(
      { contact_id: contact.id, track: plan.track, stage: 'new', first_contacted_at: null },
      { onConflict: 'contact_id' },
    );

    await db.from('apollo_staging').update({ status: 'imported', reviewed_by: by, reviewed_at: new Date().toISOString(), imported_contact_id: contact.id }).eq('id', s.id);
    imported += 1;
  }

  const counts = { ...(plan.counts || {}), imported, rejected: toReject.length };
  await db.from('apollo_weekly_plans').update({ status: 'completed', counts }).eq('id', planId);
  return { imported, rejected: toReject.length };
}
