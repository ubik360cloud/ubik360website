import { withOwner } from '../_lib/auth.js';
import { supabase } from '../_lib/supabase.js';

export default withOwner(async (req, res) => {
  const db = supabase();
  if (req.method === 'GET') {
    let query = db.from('flows').select('*, flow_steps(count), enrollments(count)').order('created_at', { ascending: false });
    if (req.query.track) query = query.eq('track', req.query.track);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ flows: data || [] });
  }

  if (req.method === 'POST') {
    const { track, name, description, send_window, per_contact_min_gap_hours } = req.body || {};
    if (track !== 'ic' && track !== 'b2b') return res.status(400).json({ error: "track must be 'ic' or 'b2b'" });
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { data, error } = await db
      .from('flows')
      .insert({ track, name, description, send_window, per_contact_min_gap_hours })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ flow: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
