// Minimal sequence engine: enroll a contact in a flow, and a runner that
// sends whatever step is due. v1 -- simpler than 360PrintStudio's reference
// (no cold-lifetime cap, no cross-flow dedupe beyond "one active enrollment
// per contact per flow") since this system runs at 10 sends/day combined,
// not thousands; add sophistication if/when volume actually needs it.
import { supabase } from './supabase.js';
import { sendEmail } from './brevo.js';
import { reserveSendSlot } from './sendCap.js';

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
    db.from('flows').select('track').eq('id', flowId).single(),
    db.from('flow_steps').select('*').eq('flow_id', flowId).eq('step_no', stepNo).maybeSingle(),
  ]);
  if (!flow) throw new Error('flow not found');
  if (!step) throw new Error(`step ${stepNo} not found on this flow`);
  if (!step.subject?.trim() || !step.body?.trim()) throw new Error('this step has no subject/body yet');

  await sendEmail({ track: flow.track, to, subject: `[TEST] ${step.subject}`, text: buildStepBody(step) });
  return { to, subject: step.subject };
}

/** Sends every enrollment whose next step is due, respecting the shared
 *  daily cap and suppression list. Designed to be called by a daily cron
 *  tick -- intentionally not a tight polling loop, this system's volume
 *  doesn't need one. */
export async function runDueSteps() {
  const db = supabase();
  const nowIso = new Date().toISOString();
  const { data: due, error } = await db
    .from('enrollments')
    .select('id, flow_id, contact_id, current_step')
    .eq('status', 'active')
    .lte('next_send_at', nowIso)
    .limit(50);
  if (error) throw error;

  let sent = 0, skipped = 0;
  for (const enr of due || []) {
    const canSend = await reserveSendSlot();
    if (!canSend) { skipped += 1; break; } // cap reached -- stop, the rest stay due for tomorrow

    const nextStepNo = enr.current_step + 1;
    const [{ data: step }, { data: contact }, { data: flow }] = await Promise.all([
      db.from('flow_steps').select('*').eq('flow_id', enr.flow_id).eq('step_no', nextStepNo).eq('is_active', true).maybeSingle(),
      db.from('contacts').select('email, do_not_contact, status').eq('id', enr.contact_id).single(),
      db.from('flows').select('track, status').eq('id', enr.flow_id).single(),
    ]);

    if (!step || flow?.status !== 'active' || !contact || contact.do_not_contact || contact.status !== 'active') {
      await db.from('enrollments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', enr.id);
      continue;
    }
    const { data: suppressed } = await db.from('suppressions').select('email').eq('email', contact.email).maybeSingle();
    if (suppressed) {
      await db.from('enrollments').update({ status: 'stopped' }).eq('id', enr.id);
      continue;
    }

    try {
      const body = buildStepBody(step);
      await sendEmail({ track: flow.track, to: contact.email, subject: step.subject, text: body });
      await db.from('email_events').insert({ contact_id: enr.contact_id, track: flow.track, event_type: 'sent', source: 'flow' });
      sent += 1;
    } catch (e) {
      console.error(`[flowEngine] send failed for enrollment ${enr.id}:`, e.message);
      skipped += 1;
      continue;
    }

    const { data: nextStep } = await db.from('flow_steps').select('delay_hours').eq('flow_id', enr.flow_id).eq('step_no', nextStepNo + 1).eq('is_active', true).maybeSingle();
    if (nextStep) {
      await db.from('enrollments').update({
        current_step: nextStepNo,
        next_send_at: new Date(Date.now() + nextStep.delay_hours * 3600e3).toISOString(),
      }).eq('id', enr.id);
    } else {
      await db.from('enrollments').update({ status: 'completed', current_step: nextStepNo, completed_at: new Date().toISOString() }).eq('id', enr.id);
    }
  }
  return { sent, skipped };
}
