import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/apollo', label: 'Apollo' },
  { to: '/drafts', label: 'Drafts' },
  { to: '/leads', label: 'Leads' },
  { to: '/flows', label: 'Flows' },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  return (
    <div>
      <header style={{ background: 'var(--black)', color: '#fff', padding: '0 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <strong style={{ letterSpacing: '.02em' }}>Ubik 360 — Growth Hub</strong>
            <nav style={{ display: 'flex', gap: '1.25rem' }}>
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => ({
                    color: isActive ? '#fff' : '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '.875rem',
                    fontWeight: isActive ? 600 : 400,
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <button
            className="btn btn-outline"
            style={{ borderColor: '#374151', color: '#fff' }}
            onClick={async () => { await supabase.auth.signOut(); navigate('/sign-in'); }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>{children}</main>
    </div>
  );
}
