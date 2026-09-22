import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const STAGES = ['new', 'contacted', 'engaged', 'replied', 'in_conversation', 'won', 'lost', 'disqualified'];

export default function Leads() {
  const [track, setTrack] = useState('');
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const params = track ? { track } : {};
      const { leads: l } = await api.leads(params);
      setLeads(l);
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, [track]); // eslint-disable-line react-hooks/exhaustive-deps

  async function moveStage(lead, stage) {
    try { await api.updateLead(lead.id, { stage }); await load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.375rem', marginBottom: '1rem' }}>Leads</h1>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
        <button className={!track ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTrack('')}>All</button>
        <button className={track === 'ic' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTrack('ic')}>ic</button>
        <button className={track === 'b2b' ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTrack('b2b')}>b2b</button>
      </div>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8125rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#6b7280' }}>
            <th style={{ padding: '.4rem 0' }}>Track</th><th>Company</th><th>Contact</th><th>Stage</th><th>Fit</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} style={{ borderTop: '1px solid #f3f4f6' }}>
              <td style={{ padding: '.4rem 0' }}><span className={`badge badge-${l.track}`}>{l.track}</span></td>
              <td>{l.contacts?.company}</td>
              <td>{[l.contacts?.first_name, l.contacts?.last_name].filter(Boolean).join(' ')} — {l.contacts?.email}</td>
              <td>
                <select value={l.stage} onChange={(e) => moveStage(l, e.target.value)} style={{ width: 'auto', padding: '.2rem .4rem' }}>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td>{l.fit_score || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!leads.length && <p>No leads yet.</p>}
    </div>
  );
}
