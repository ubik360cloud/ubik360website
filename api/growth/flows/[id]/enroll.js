import { withOwner } from '../../_lib/auth.js';
import { enrollContact } from '../../_lib/flowEngine.js';

export default withOwner(async (req, res, ownerEmail) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { contact_ids } = req.body || {};
  if (!Array.isArray(contact_ids) || !contact_ids.length) return res.status(400).json({ error: 'contact_ids array is required' });

  let enrolled = 0;
  const skipped = {};
  for (const contactId of contact_ids) {
    const r = await enrollContact({ flowId: req.query.id, contactId, enrolledBy: ownerEmail });
    if (r.ok) enrolled += 1; else skipped[r.skipped] = (skipped[r.skipped] || 0) + 1;
  }
  return res.status(200).json({ enrolled, skipped });
});
