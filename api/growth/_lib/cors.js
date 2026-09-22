// The hub app lives on marketing.ubik360.com, calling this API on
// ubik360.com -- cross-origin, so every route needs these headers plus an
// OPTIONS preflight response. Centralized here and applied inside
// withOwner/withCron rather than repeated per route file.
const ALLOWED_ORIGIN = process.env.GROWTH_HUB_ORIGIN || 'https://marketing.ubik360.com';

/** Sets CORS headers; returns true if this request was an OPTIONS preflight
 *  (already fully handled -- the caller should return immediately). */
export function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
