// Simple "am I the authenticated owner" check for the hub's login gate.
import { withOwner } from './_lib/auth.js';

export default withOwner(async (req, res, ownerEmail) => {
  return res.status(200).json({ email: ownerEmail });
});
