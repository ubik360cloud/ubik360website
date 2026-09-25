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
import { enrollContact } from './flowEngine.js';

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
    person_titles: ['founder', 'ceo', 'owner', 'president', 'director', 'general manager'],
    q_organization_keyword_tags: ['small business', 'growth stage company'],
    person_locations: ['United States', 'Canada'],
    // 25-100 employees, so we're reaching an actual decision-maker directly
    // rather than a company big enough to have a gatekeeper/internal team --
    // Jose 2026-09-24, after the Colombia test pull's top matches (Alquería,
    // Audifarma) turned out to be large companies the titles filter alone
    // didn't catch. Apply to every b2b geography, not just Colombia.
    organization_num_employees_ranges: ['25,100'],
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

/** Free-preview: runs ONLY the free `mixed_people/api_search` step (no
 *  `people/bulk_match`, no `apollo_staging` insert) -- lets Jose gauge how
 *  many contacts a filter actually matches, and skim who they are, before
 *  spending any Apollo credits deciding to bulk_match/import them. Apollo's
 *  people-search endpoint costs nothing regardless of page size; only
 *  bulk_match (which reveals a real email) is metered per record requested.
 *  `per_page` is explicit here (100, Apollo's documented per-page unit) --
 *  pullApolloForPlan doesn't set it and falls back to Apollo's smaller
 *  implicit default, which is fine for a small weekly pull but not for
 *  previewing a bigger pool in one shot. */
export async function previewSearch(filter, { limit = 100 } = {}) {
  const searchBody = buildSearchBody(filter);
  let page = 1;
  let totalEntries = 0;
  const sample = [];
  while (sample.length < limit && page <= MAX_PAGES) {
    let res;
    try {
      res = await apolloFetch('/mixed_people/api_search', { ...searchBody, page, per_page: 100 });
    } catch (e) {
      console.error('[weeklyPlan] preview search page failed:', e.message);
      break;
    }
    totalEntries = res.total_entries ?? totalEntries;
    const people = res.people || [];
    if (!people.length) break;
    for (const p of people) {
      if (sample.length >= limit) break;
      sample.push({
        apollo_id: p.id,
        name: [p.first_name, p.last_name].filter(Boolean).join(' ') || null,
        title: p.title || null,
        company: p.organization?.name || null,
        company_size: p.organization?.estimated_num_employees ?? null,
        city: p.city || null,
        state: p.state || null,
        country: p.country || null,
        has_email: p.email_status === 'verified' || Boolean(p.email && p.email !== 'email_not_unlocked@domain.com'),
      });
    }
    if (page * 100 >= totalEntries) break;
    page += 1;
  }
  return { total_entries: totalEntries, returned: sample.length, sample };
}

/** Edits a plan's filter/label/target/brief -- only while it's still
 *  'proposed'. Once approved, the filter is a historical record of what was
 *  actually queried (Apollo was already paid for those exact results) --
 *  editing it after the fact wouldn't change anything already pulled, it'd
 *  just make the stored filter lie about what produced the staged
 *  candidates. To refine after approving, create a new labeled plan (a
 *  "v2") with the adjusted filter instead. */
export async function updatePlan(planId, { label, brief, filter, target }) {
  const db = supabase();
  const { data: plan, error: loadErr } = await db.from('apollo_weekly_plans').select('status, filter, counts').eq('id', planId).single();
  if (loadErr || !plan) throw new Error('plan not found');
  if (plan.status !== 'proposed') {
    throw new Error(`This plan is already '${plan.status}' -- its filter is a record of what was actually queried and can't be edited after the fact. Create a new labeled plan with the adjusted filter instead.`);
  }

  const patch = {};
  if (label !== undefined) patch.label = label;
  if (brief !== undefined) { patch.brief = brief; patch.rationale = brief; }
  if (filter !== undefined || target !== undefined) {
    const base = filter !== undefined ? filter : plan.filter;
    const newTarget = target ?? plan.filter?.target;
    patch.filter = { ...base, target: newTarget };
    patch.counts = { ...(plan.counts || {}), target: newTarget };
  }

  const { data: updated, error } = await db.from('apollo_weekly_plans').update(patch).eq('id', planId).select().single();
  if (error) throw error;
  return updated;
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

/** Imports approved staged contacts -> contacts + leads, tagged with
 *  `source_plan_id` so they can be targeted as a segment later (see
 *  005_segments.sql). Auto-enrolls into `plan.flow_id`'s flow IF one is
 *  already linked at import time (e.g. a recurring plan whose segment
 *  already has an active flow) -- for a plan imported before any flow
 *  exists, enrolling the segment is a separate explicit action from the
 *  Flows page once the flow's content is drafted and approved. */
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
          source_plan_id: planId,
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

    if (plan.flow_id) {
      await enrollContact({ flowId: plan.flow_id, contactId: contact.id, enrolledBy: by });
    }
  }

  const counts = { ...(plan.counts || {}), imported, rejected: toReject.length };
  await db.from('apollo_weekly_plans').update({ status: 'completed', counts }).eq('id', planId);
  return { imported, rejected: toReject.length };
}

/** Enrolls every already-imported contact from a plan (segment) into a
 *  flow, in one action -- the common case for a plan that finished
 *  importing before its flow existed (stageApprove's own auto-enroll only
 *  covers a plan whose flow_id was already linked at import time). Skips
 *  contacts enrollContact itself would skip (unsubscribed, suppressed,
 *  already enrolled -- upsert is a no-op there). */
export async function enrollSegment({ planId, flowId, enrolledBy = 'owner' }) {
  const db = supabase();
  const { data: flow } = await db.from('flows').select('status').eq('id', flowId).single();
  if (flow?.status !== 'active') {
    throw new Error("Flow must be approved & activated before enrolling -- enrolling into a flow that's still 'draft' would mark the enrollment complete without ever sending once it later activates.");
  }

  const { data: contacts, error } = await db.from('contacts').select('id').eq('source_plan_id', planId);
  if (error) throw error;

  let enrolled = 0;
  const skipped = [];
  for (const c of contacts || []) {
    const result = await enrollContact({ flowId, contactId: c.id, enrolledBy });
    if (result.ok) enrolled += 1;
    else skipped.push(result.skipped);
  }
  return { total: (contacts || []).length, enrolled, skipped };
}
