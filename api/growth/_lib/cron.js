// Vercel Cron requests carry a bearer token Vercel generates from
// CRON_SECRET automatically (Authorization: Bearer <CRON_SECRET>) -- this
// just confirms the request actually came from Vercel's scheduler and not
// an open POST to a cron-only endpoint.
export function requireCron(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw { status: 500, message: 'CRON_SECRET not set' };
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${secret}`) throw { status: 401, message: 'Unauthorized' };
}

export function withCron(handler) {
  return async (req, res) => {
    try {
      requireCron(req);
      return await handler(req, res);
    } catch (err) {
      const status = err?.status || 500;
      console.error('[cron]', err?.message || err);
      return res.status(status).json({ error: err?.message || 'Server error' });
    }
  };
}
