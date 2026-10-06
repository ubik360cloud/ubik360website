// Minimal sequence engine: enroll a contact in a flow, and a runner that
// sends whatever step is due. v1 -- simpler than 360PrintStudio's reference
// (no cold-lifetime cap, no cross-flow dedupe beyond "one active enrollment
// per contact per flow") since this system runs at 10 sends/day combined,
// not thousands; add sophistication if/when volume actually needs it.
import { supabase } from './supabase.js';
import { sendEmail } from './sendgrid.js';
import { reserveSendSlot, sendsRemainingToday } from './sendCap.js';

// Shared with sendTestEmail below so a test send renders EXACTLY what a
// real contact would get -- same CTA placement, same signature/opt-out
// footer (via sendEmail -> ensureSignature -> ensureOptOut). Plain text,
// deliberately: cta_label (e.g. "Let's Talk" / "¿Hablamos?") reads as a
// short caption before the bare URL, the plain-text equivalent of anchor
// text since there's no styled button here.
function buildStepBody(step) {
  if (!step.cta_url) return step.body;
  const cta = step.cta_label ? `${step.cta_label}: ${step.cta_url}` : step.cta_url;
  return `${step.body}\n\n${cta}`;
}

/** Substitutes the `{{first_name}}` mail-merge token flowAssistant.js's
 *  drafts open every step with (2026-09-29, Jose: templates had no
 *  salutation at all since one static body goes to a whole segment). A
 *  real name replaces it directly; a contact with none on file gets the
 *  token AND its preceding space dropped, so "Hola {{first_name}}," folds
 *  down to "Hola," instead of leaving an awkward gap. `placeholder` lets
 *  sendTestEmail show `[First Name]` instead of silently dropping it, so
 *  a test send still demonstrates the token exists. */
function personalize(text, firstName, placeholder) {
  if (firstName) return text.split('{{first_name}}').join(firstName);
  if (placeholder) return text.split('{{first_name}}').join(placeholder);
  return text.split(' {{first_name}}').join('');
}

export async function enrollContact({ flowId, contactId, enrolledBy = 'owner' }) {
  const db = supabase();
  const { data: contact } = await db.from('contacts').select('do_not_contact, status, email').eq('id', contactId).single();
  if (!contact || contact.do_not_contact || contact.status !== 'active') {
    return { ok: false, skipped: 'contact-not-eligible' };
  }
  const { data: suppressed } = await db.from('suppressions').select('email').eq('email', contact.email).maybeSingle();
  if (suppressed) return { ok: false, skipped: 'suppressed' };

  // Enrolling is a create-only operation, never a reset -- the naive upsert
  // this replaced always reset current_step to 0 and next_send_at to now,
  // so re-running "Enroll segment" on a plan/flow that already has active or
  // completed enrollments would silently restart those contacts from step 1
  // and re-send what they'd already received. If a contact ever genuinely
  // needs to redo a flow, that should be its own explicit action, not a
  // side effect of enrolling a fresh batch.
  const { data: existing } = await db.from('enrollments').select('id').eq('flow_id', flowId).eq('contact_id', contactId).maybeSingle();
  if (existing) return { ok: false, skipped: 'already-enrolled' };

  const { data: step1 } = await db.from('flow_steps').select('delay_hours').eq('flow_id', flowId).eq('step_no', 1).eq('is_active', true).maybeSingle();
  if (!step1) return { ok: false, skipped: 'flow-has-no-active-step-1' };

  const nextSendAt = new Date(Date.now() + (step1.delay_hours || 0) * 3600e3).toISOString();
  const { error } = await db
    .from('enrollments')
    .insert({ flow_id: flowId, contact_id: contactId, status: 'active', current_step: 0, next_send_at: nextSendAt, enrolled_by: enrolledBy });
  if (error) return { ok: false, skipped: 'insert-failed' };
  return { ok: true };
}

/** Sends one step to an arbitrary address (Jose's own inbox by default) so
 *  he can see exactly what a contact would receive -- subject, body, CTA
 *  placement, and the real opt-out footer -- before enrolling anyone for
 *  real. Doesn't touch enrollments, contacts, or the daily send cap; a test
 *  send is not a real send. Subject gets a "[TEST] " prefix so it can't be
 *  mistaken for the real thing sitting in an inbox. */
export async function sendTestEmail({ flowId, stepNo, to }) {
  const db = supabase();
  const [{ data: flow }, { data: step }] = await Promise.all([
    db.from('flows').select('track, language').eq('id', flowId).single(),
    db.from('flow_steps').select('*').eq('flow_id', flowId).eq('step_no', stepNo).maybeSingle(),
  ]);
  if (!flow) throw new Error('flow not found');
  if (!step) throw new Error(`step ${stepNo} not found on this flow`);
  if (!step.subject?.trim() || !step.body?.trim()) throw new Error('this step has no subject/body yet');

  const text = personalize(buildStepBody(step), null, flow.language === 'es' ? '[Nombre]' : '[First Name]');
  await sendEmail({ track: flow.track, to, subject: `[TEST] ${step.subject}`, text, lang: flow.language });
  return { to, subject: step.subject };
}

/** Splits `budget` sends across flows as evenly as possible: everyone gets an
 *  equal share, and a flow with fewer due contacts than its share hands the
 *  leftover back to the others (so 5 + 18 + 437 due with a budget of 100
 *  becomes 5 / 18 / 77, not 33 / 33 / 33 with 49 sends wasted). */
export function allocateQuota(budget, dueCounts) {
  const quotas = Object.fromEntries(Object.keys(dueCounts).map((k) => [k, 0]));
  let left = budget;
  let open = Object.keys(dueCounts).filter((k) => dueCounts[k] > 0);
  while (left > 0 && open.length) {
    const share = Math.max(1, Math.floor(left / open.length));
    const stillOpen = [];
    for (const k of open) {
      if (left <= 0) break;
      const give = Math.min(share, dueCounts[k] - quotas[k], left);
      quotas[k] += give;
      left -= give;
      if (quotas[k] < dueCounts[k]) stillOpen.push(k);
    }
    open = stillOpen;
  }
  return quotas;
}

const SEND_CONCURRENCY = 5;

/** Sends every enrollment whose next step is due, using whatever is left of
 *  today's total send allowance (100 minus anything already sent today,
 *  1:1 included -- see sendCap.js), split evenly across active flows
 *  (allocateQuota). Called by the daily cron (2PM ET / 18:00 UTC, so a
 *  morning's 1:1 sends have already claimed their share). Time-budgeted so
 *  a big batch can't run into the serverless function's duration limit:
 *  whatever isn't reached stays due and goes out on the next run. */
export async function runDueSteps({ budgetMs = 45000 } = {}) {
  const started = Date.now();
  const db = supabase();

  const remaining = await sendsRemainingToday();
  if (remaining <= 0) return { sent: 0, skipped: 0, remaining: 0, perFlow: {} };

  const { data: due, error } = await db
    .from('enrollments')
    .select('id, flow_id, contact_id, current_step')
    .eq('status', 'active')
    .lte('next_send_at', new Date().toISOString())
    .order('next_send_at', { ascending: true })
    .limit(1000);
  if (error) throw error;
  if (!due?.length) return { sent: 0, skipped: 0, remaining, perFlow: {} };

  const flowIds = [...new Set(due.map((e) => e.flow_id))];
  const [{ data: flows }, { data: allSteps }] = await Promise.all([
    db.from('flows').select('id, track, status, language').in('id', flowIds),
    db.from('flow_steps').select('*').in('flow_id', flowIds).eq('is_active', true),
  ]);
  const flowById = Object.fromEntries((flows || []).map((f) => [f.id, f]));
  const stepsByFlow = {};
  for (const s of allSteps || []) (stepsByFlow[s.flow_id] ||= {})[s.step_no] = s;

  // Enrollments of flows that aren't active any more (paused/draft) aren't
  // this run's business -- they stay as they are, same as before.
  const dueByFlow = {};
  for (const e of due) if (flowById[e.flow_id]?.status === 'active') (dueByFlow[e.flow_id] ||= []).push(e);
  const quotas = allocateQuota(remaining, Object.fromEntries(Object.entries(dueByFlow).map(([k, v]) => [k, v.length])));
  const selected = Object.entries(dueByFlow).flatMap(([flowId, list]) => list.slice(0, quotas[flowId] || 0));
  if (!selected.length) return { sent: 0, skipped: 0, remaining, perFlow: {} };

  const contactIds = [...new Set(selected.map((e) => e.contact_id))];
  const { data: contacts } = await db.from('contacts').select('id, email, first_name, do_not_contact, status').in('id', contactIds);
  const contactById = Object.fromEntries((contacts || []).map((c) => [c.id, c]));
  const { data: suppressions } = await db.from('suppressions').select('email').in('email', (contacts || []).map((c) => c.email));
  const suppressed = new Set((suppressions || []).map((s) => s.email));

  let sent = 0, skipped = 0, outOfTime = false, capHit = false;
  const perFlow = {};
  const queue = [...selected];

  async function processOne(enr) {
    const flow = flowById[enr.flow_id];
    const nextStepNo = enr.current_step + 1;
    const step = stepsByFlow[enr.flow_id]?.[nextStepNo];
    const contact = contactById[enr.contact_id];

    if (!step || !contact || contact.do_not_contact || contact.status !== 'active') {
      await db.from('enrollments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', enr.id);
      return;
    }
    if (suppressed.has(contact.email)) {
      await db.from('enrollments').update({ status: 'stopped' }).eq('id', enr.id);
      return;
    }

    // Reserved right before the send (not up front) so skipped/completed
    // enrollments above never burn a slot.
    if (!(await reserveSendSlot({ kind: 'flow' }))) { capHit = true; return; }
    try {
      const body = personalize(buildStepBody(step), contact.first_name);
      await sendEmail({ track: flow.track, to: contact.email, subject: step.subject, text: body, lang: flow.language });
      await db.from('email_events').insert({ contact_id: enr.contact_id, track: flow.track, event_type: 'sent', source: 'flow' });
      sent += 1;
      perFlow[enr.flow_id] = (perFlow[enr.flow_id] || 0) + 1;
    } catch (e) {
      console.error(`[flowEngine] send failed for enrollment ${enr.id}:`, e.message);
      skipped += 1;
      return;
    }

    const nextStep = stepsByFlow[enr.flow_id]?.[nextStepNo + 1];
    if (nextStep) {
      await db.from('enrollments').update({
        current_step: nextStepNo,
        next_send_at: new Date(Date.now() + nextStep.delay_hours * 3600e3).toISOString(),
      }).eq('id', enr.id);
    } else {
      await db.from('enrollments').update({ status: 'completed', current_step: nextStepNo, completed_at: new Date().toISOString() }).eq('id', enr.id);
    }
  }

  async function worker() {
    while (queue.length && !capHit) {
      if (Date.now() - started > budgetMs) { outOfTime = true; return; }
      const enr = queue.shift();
      try { await processOne(enr); }
      catch (e) { console.error(`[flowEngine] enrollment ${enr.id} failed:`, e.message); skipped += 1; }
    }
  }
  await Promise.all(Array.from({ length: SEND_CONCURRENCY }, worker));

  return { sent, skipped, remaining: Math.max(0, remaining - sent), perFlow, outOfTime, capHit };
}
