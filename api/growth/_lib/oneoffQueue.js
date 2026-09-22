// The 1:1 research + draft queue's producer. Daily pull of fresh Apollo
// leads per track, researched via prospectResearch.js, staged into
// `oneoffs` for the owner to approve/edit/reject/send. Directly adapted
// from 360PrintStudio's oneoffQueue.js.
import { supabase } from './supabase.js';
import { research } from './prospectResearch.js';

const DAILY_LIMIT_PER_TRACK = Number(process.env.GROWTH_ONEOFF_DAILY_LIMIT_PER_TRACK || 5);

/** Researches + drafts up to `limit` fresh leads for one track that have
 *  never been through this queue before (a lead is "done" once any oneoffs
 *  row exists for its contact -- including an auto-rejected skip). */
export async function dailyOneoffPull(track, { limit = DAILY_LIMIT_PER_TRACK } = {}) {
  const db = supabase();
  const { data: already } = await db.from('oneoffs').select('contact_id').eq('track', track);
  const processed = new Set((already || []).map((r) => r.contact_id));

  const { data: leads, error } = await db
    .from('leads')
    .select('id, contact_id, stage, created_at')
    .eq('track', track)
    .in('stage', ['new', 'contacted'])
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;

  const candidateLeadIds = (leads || []).filter((l) => !processed.has(l.contact_id)).slice(0, limit);
  if (!candidateLeadIds.length) return { drafted: 0, skipped: 0, errored: 0 };

  const { data: contacts } = await db
    .from('contacts')
    .select('id, email, first_name, last_name, company, company_domain, title, do_not_contact, status')
    .in('id', candidateLeadIds.map((l) => l.contact_id));
  const contactById = Object.fromEntries((contacts || []).map((c) => [c.id, c]));

  let drafted = 0, skipped = 0, errored = 0;
  for (const lead of candidateLeadIds) {
    const contact = contactById[lead.contact_id];
    if (!contact?.email || contact.do_not_contact || contact.status !== 'active' || !contact.company_domain) continue;

    const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
    const url = `https://${contact.company_domain}`;
    try {
      const verdict = await research({ track, name, company: contact.company, urls: [url], notes: null });
      const isSkip = verdict.fit === 'skip';
      await db.from('oneoffs').insert({
        contact_id: contact.id,
        track,
        research: verdict,
        subject: verdict.subject || null,
        body: verdict.body || null,
        status: isSkip ? 'rejected' : 'pending',
        ...(isSkip ? { approved_at: new Date().toISOString(), approved_by: 'system:auto-skip' } : {}),
      });
      await db.from('leads').update({ fit_score: verdict.fit, stage: 'contacted' }).eq('id', lead.id);
      if (isSkip) skipped += 1; else drafted += 1;
    } catch (e) {
      errored += 1;
      console.error(`[oneoffQueue] research failed for ${contact.email}:`, e.message);
    }
  }
  return { drafted, skipped, errored };
}
