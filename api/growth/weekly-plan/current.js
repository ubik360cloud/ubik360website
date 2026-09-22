import { withOwner } from '../_lib/auth.js';
import { supabase } from '../_lib/supabase.js';

export default withOwner(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const track = req.query.track;
  if (track !== 'ic' && track !== 'b2b') return res.status(400).json({ error: "track must be 'ic' or 'b2b'" });

  const db = supabase();
  const { data, error } = await db
    .from('apollo_weekly_plans')
    .select('*')
    .eq('track', track)
    .order('week_of', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ plan: data || null });
});
