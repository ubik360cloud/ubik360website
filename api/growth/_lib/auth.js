// Single-owner auth gate. No staff roles/invites (unlike 360PrintStudio's
// marketing-hub) -- this system has exactly one user, Jose, so the check is
// just "does this Supabase JWT belong to the allowlisted owner email".
import { createClient } from '@supabase/supabase-js';
import { applyCors } from './cors.js';

/** Returns the authenticated owner's email, or throws a { status, message }
 *  error the caller should turn into an HTTP response. */
export async function requireOwner(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) throw { status: 401, message: 'Missing bearer token' };

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
