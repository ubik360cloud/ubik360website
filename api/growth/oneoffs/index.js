import { withOwner } from '../_lib/auth.js';
import { supabase } from '../_lib/supabase.js';

export default withOwner(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const db = supabase();
  let query = db
    .from('oneoffs')
    .select('*, contacts(email, first_name, last_name, company, title)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (req.query.status) query = query.eq('status', req.query.status);
  if (req.query.track) query = query.eq('track', req.query.track);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ oneoffs: data || [] });
});
