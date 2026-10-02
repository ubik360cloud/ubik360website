import { withOwner } from '../_lib/auth.js';
import { supabase } from '../_lib/supabase.js';
import { sendsRemainingToday } from '../_lib/sendCap.js';

export const deliverability = withOwner(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const db = supabase();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();

  const [{ data: events }, { data: suppressions }, { data: contacts }, remaining] = await Promise.all([
    db.from('email_events').select('event_type, track, created_at').gte('created_at', since),
    db.from('suppressions').select('reason'),
    db.from('contacts').select('status, track'),
    sendsRemainingToday(),
  ]);

  const byType = {};
  const byTrack = { ic: {}, b2b: {} };
  for (const e of events || []) {
    byType[e.event_type] = (byType[e.event_type] || 0) + 1;
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
    sendsRemainingToday: remaining,
  });
});

export const me = withOwner(async (req, res, ownerEmail) => {
  return res.status(200).json({ email: ownerEmail });
});
