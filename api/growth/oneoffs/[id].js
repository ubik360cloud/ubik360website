import { withOwner } from '../_lib/auth.js';
import { supabase } from '../_lib/supabase.js';

export default withOwner(async (req, res, ownerEmail) => {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const { subject, body, status } = req.body || {};
  if (status && !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
  }

  const patch = {};
  if (subject !== undefined) patch.subject = subject;
  if (body !== undefined) patch.body = body;
  if (status) {
    patch.status = status;
    patch.approved_at = new Date().toISOString();
    patch.approved_by = ownerEmail;
  }

  const db = supabase();
  const { data, error } = await db.from('oneoffs').update(patch).eq('id', req.query.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ oneoff: data });
});
