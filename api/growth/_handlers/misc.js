import { withOwner } from '../_lib/auth.js';
import { supabase } from '../_lib/supabase.js';
import { sendStatusToday } from '../_lib/sendCap.js';

export const deliverability = withOwner(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const db = supabase();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();

  const [{ data: events }, { data: suppressions }, { data: contacts }, sendStatus, waiting, dueNow] = await Promise.all([
    db.from('email_events').select('event_type, track, source, created_at').gte('created_at', since),
    db.from('suppressions').select('reason'),
    db.from('contacts').select('status, track'),
    sendStatusToday(),
    activeFlowEnrollmentCount(db, false),
    activeFlowEnrollmentCount(db, true),
  ]);

  const bySource = {};
  const byType = {};
  const byTrack = { ic: {}, b2b: {} };
  for (const e of events || []) {
    byType[e.event_type] = (byType[e.event_type] || 0) + 1;
    if (e.event_type === 'sent' && e.source) bySource[e.source] = (bySource[e.source] || 0) + 1;
    if (e.track) byTrack[e.track][e.event_type] = (byTrack[e.track][e.event_type] || 0) + 1;
  }
  const suppressionsByReason = {};
  for (const s of suppressions || []) suppressionsByReason[s.reason] = (suppressionsByReason[s.reason] || 0) + 1;
  const contactsByStatus = {};
  for (const c of contacts || []) contactsByStatus[c.status] = (contactsByStatus[c.status] || 0) + 1;

  return res.status(200).json({
    last30d: { byType, byTrack },
    suppressions: { total: suppressions?.length || 0, byReason: suppressionsByReason },
    contacts: { total: contacts?.length || 0, byStatus: contactsByStatus },
    sendStatus,
    flowQueue: { activeEnrollments: waiting.count || 0, dueNow: dueNow.count || 0 },
    // Last 30 days of sends split by where they came from (flow vs 1:1) --
    // the by-track table can't tell the two apart.
    sentBySource: bySource,
  });
});

export const me = withOwner(async (req, res, ownerEmail) => {
  return res.status(200).json({ email: ownerEmail });
});

// Only enrollments in flows that are actually running count as "waiting" --
// a paused flow's contacts aren't going to receive anything.
async function activeFlowEnrollmentCount(db, dueOnly) {
  const { data: flows } = await db.from('flows').select('id').eq('status', 'active');
  const ids = (flows || []).map((f) => f.id);
  if (!ids.length) return { count: 0 };
  let q = db.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active').in('flow_id', ids);
  if (dueOnly) q = q.lte('next_send_at', new Date().toISOString());
  return q;
}
