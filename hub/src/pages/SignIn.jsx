import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (err) setError(err.message);
    else setSent(true);
  }

  return (
    <div style={{ maxWidth: 360, margin: '6rem auto', padding: '0 1.5rem' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Ubik 360 — Growth Hub</h1>
      {sent ? (
        <p className="card">Check {email} for a sign-in link.</p>
      ) : (
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <input type="email" required placeholder="you@ubik360.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="btn btn-primary">Send magic link</button>
          {error && <p style={{ color: '#b91c1c', fontSize: '.8125rem' }}>{error}</p>}
        </form>
      )}
    </div>
  );
}
