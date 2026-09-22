import { withOwner } from '../_lib/auth.js';
import { supabase } from '../_lib/supabase.js';

export default withOwner(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const db = supabase();
  let query = db
    .from('leads')
    .select('*, contacts(email, first_name, last_name, company, title)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (req.query.track) query = query.eq('track', req.query.track);
  if (req.query.stage) query = query.eq('stage', req.query.stage);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const board = {};
  for (const lead of data || []) board[lead.stage] = (board[lead.stage] || 0) + 1;
  return res.status(200).json({ leads: data || [], board });
});
