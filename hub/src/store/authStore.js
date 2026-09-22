import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { api } from '../lib/api.js';

/** hydrated: Supabase session checked. ownerChecked: /me answered (confirms
 *  this session belongs to the allowlisted owner, not just any Supabase
 *  user). Mirrors the reference hub's two-stage auth store, minus roles --
 *  single owner here, so there's nothing to rank. */
export function useAuth() {
  const [session, setSession] = useState(undefined);
  const [hydrated, setHydrated] = useState(false);
  const [ownerChecked, setOwnerChecked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setHydrated(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) { setOwnerChecked(true); setIsOwner(false); return; }
    api.me().then(() => setIsOwner(true)).catch(() => setIsOwner(false)).finally(() => setOwnerChecked(true));
  }, [hydrated, session]);

  return { session, hydrated, ownerChecked, isOwner };
}
