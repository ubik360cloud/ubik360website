// Minimal sequence engine: enroll a contact in a flow, and a runner that
// sends whatever step is due. v1 -- simpler than 360PrintStudio's reference
// (no cold-lifetime cap, no cross-flow dedupe beyond "one active enrollment
// per contact per flow") since this system runs at 10 sends/day combined,
// not thousands; add sophistication if/when volume actually needs it.
import { supabase } from './supabase.js';
import { sendEmail } from './brevo.js';
import { reserveSendSlot } from './sendCap.js';

export async function enrollContact({ flowId, contactId, enrolledBy = 'owner' }) {
  const db = supabase();
  const { data: contact } = await db.from('contacts').select('do_not_contact, status, email').eq('id', contactId).single();
  if (!contact || contact.do_not_contact || contact.status !== 'active') {
    return { ok: false, skipped: 'contact-not-eligible' };
  }
  const { data: suppressed } = await db.from('suppressions').select('email').eq('email', contact.email).maybeSingle();
  if (suppressed) return { ok: false, skipped: 'suppressed' };

  const { data: step1 } = await db.from('flow_steps').select('delay_hours').eq('flow_id', flowId).eq('step_no', 1).eq('is_active', true).maybeSingle();
  if (!step1) return { ok: false, skipped: 'flow-has-no-active-step-1' };

  const nextSendAt = new Date(Date.now() + (step1.delay_hours || 0) * 3600e3).toISOString();
  const { error } = await db
    .from('enrollments')
    .upsert({ flow_id: flowId, contact_id: contactId, status: 'active', current_step: 0, next_send_at: nextSendAt, enrolled_by: enrolledBy }, { onConflict: 'flow_id,contact_id' });
  if (error) return { ok: false, skipped: 'upsert-failed' };
  return { ok: true };
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
      const body = step.cta_url ? `${step.body}\n\n${step.cta_url}` : step.body;
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
