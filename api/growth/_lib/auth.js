// Single-owner auth gate. No staff roles/invites (unlike 360PrintStudio's
// marketing-hub) -- this system has exactly one user, Jose, so the check is
// just "does this Supabase JWT belong to the allowlisted owner email".
import { createClient } from '@supabase/supabase-js';
import { applyCors } from './cors.js';

/** Returns the authenticated owner's email, or throws a { status, message }
 *  error the caller should turn into an HTTP response. Accepts either a
 *  Supabase owner session JWT (the hub UI's normal path) or, as a scriptable
 *  alternative for direct/CLI-triggered admin actions (e.g. one-off Apollo
 *  test pulls) that don't go through the browser, a static
 *  GROWTH_ADMIN_SECRET bearer token -- same trust level as the owner, kept
 *  out of git the same way CRON_SECRET is. */
export async function requireOwner(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) throw { status: 401, message: 'Missing bearer token' };

  const adminSecret = process.env.GROWTH_ADMIN_SECRET;
  if (adminSecret && token === adminSecret) return process.env.GROWTH_OWNER_EMAIL || 'admin';

  const url = process.env.GROWTH_SUPABASE_URL;
  const anonKey = process.env.GROWTH_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw { status: 500, message: 'Server not configured' };

  const client = createClient(url, anonKey);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user?.email) throw { status: 401, message: 'Invalid session' };

  const ownerEmail = (process.env.GROWTH_OWNER_EMAIL || '').toLowerCase();
  if (!ownerEmail) throw { status: 500, message: 'GROWTH_OWNER_EMAIL not set' };
  if (data.user.email.toLowerCase() !== ownerEmail) {
    throw { status: 403, message: 'Not authorized' };
  }
  return data.user.email;
}

/** Wraps a handler with the owner check + consistent error responses. */
export function withOwner(handler) {
  return async (req, res) => {
    if (applyCors(req, res)) return;
    try {
      const email = await requireOwner(req);
      return await handler(req, res, email);
    } catch (err) {
      const status = err?.status || 500;
      console.error('[auth]', err?.message || err);
      return res.status(status).json({ error: err?.message || 'Server error' });
    }
  };
}
