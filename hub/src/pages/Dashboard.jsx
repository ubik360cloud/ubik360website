import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [pendingDrafts, setPendingDrafts] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.deliverability(), api.oneoffs({ status: 'pending' })])
      .then(([d, o]) => { setStats(d); setPendingDrafts(o.oneoffs.length); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: '#b91c1c' }}>{error}</p>;
  if (!stats) return <p>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: '1.375rem', marginBottom: '1.5rem' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatTile label="Sends remaining today" value={stats.sendsRemainingToday} />
        <StatTile label="Pending drafts" value={pendingDrafts} />
        <StatTile label="Active contacts" value={stats.contacts.byStatus.active || 0} />
        <StatTile label="Suppressed" value={stats.suppressions.total} />
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1rem', marginTop: 0 }}>Last 30 days, by track</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.875rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#6b7280' }}>
              <th style={{ padding: '.4rem 0' }}>Track</th>
              <th>Sent</th><th>Delivered</th><th>Opened</th><th>Replied</th><th>Bounced</th>
            </tr>
          </thead>
          <tbody>
            {['ic', 'b2b'].map((track) => {
              const t = stats.last30d.byTrack[track] || {};
              return (
                <tr key={track} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '.4rem 0' }}><span className={`badge badge-${track}`}>{track}</span></td>
                  <td>{t.sent || 0}</td><td>{t.delivered || 0}</td><td>{t.opened || 0}</td><td>{t.replied || 0}</td><td>{t.bounced || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="card">
      <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: '.8125rem', color: '#6b7280' }}>{label}</div>
    </div>
  );
}
