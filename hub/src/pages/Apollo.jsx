import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const TRACKS = ['ic', 'b2b'];

export default function Apollo() {
  const [track, setTrack] = useState('ic');
  const [plan, setPlan] = useState(null);
  const [staged, setStaged] = useState([]);
  const [excluded, setExcluded] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const { plan: p } = await api.weeklyPlan(track);
      setPlan(p);
      if (p && ['staged', 'enrolling', 'completed'].includes(p.status)) {
        const { staged: s } = await api.weeklyPlanStaged(p.id);
        setStaged(s);
      } else {
        setStaged([]);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, [track]); // eslint-disable-line react-hooks/exhaustive-deps

  async function approve() {
    setBusy(true);
    try { await api.approveWeeklyPlan(plan.id); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function stageApprove() {
    setBusy(true);
    try { await api.stageApprove(plan.id, [...excluded]); setExcluded(new Set()); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  function toggleExclude(id) {
    setExcluded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.375rem', marginBottom: '1rem' }}>Apollo — weekly plan</h1>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
        {TRACKS.map((t) => (
          <button key={t} className={track === t ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTrack(t)}>{t}</button>
        ))}
      </div>

      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {!plan && <p>No plan proposed yet for this track this week.</p>}

      {plan && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <span className="badge">{plan.status}</span>
              <p style={{ margin: '.5rem 0 0' }}>{plan.rationale}</p>
              <p style={{ fontSize: '.8125rem', color: '#6b7280' }}>
                Week of {plan.week_of} · target {plan.filter?.target}
                {plan.counts?.staged != null && ` · ${plan.counts.staged} staged`}
              </p>
            </div>
            {plan.status === 'proposed' && (
              <button className="btn btn-primary" disabled={busy} onClick={approve}>
                Approve &amp; pull from Apollo (spends credits)
              </button>
            )}
          </div>
        </div>
      )}

      {staged.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <h2 style={{ fontSize: '1rem', margin: 0 }}>Staged candidates ({staged.length})</h2>
            {plan.status === 'staged' && (
              <button className="btn btn-primary" disabled={busy} onClick={stageApprove}>
                Import {staged.length - excluded.size} · reject {excluded.size}
              </button>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8125rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                <th></th><th>Name</th><th>Title</th><th>Company</th><th>Email</th>
              </tr>
            </thead>
            <tbody>
              {staged.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid #f3f4f6', opacity: excluded.has(s.id) ? 0.4 : 1 }}>
                  <td><input type="checkbox" checked={excluded.has(s.id)} onChange={() => toggleExclude(s.id)} title="Exclude" /></td>
                  <td>{[s.first_name, s.last_name].filter(Boolean).join(' ')}</td>
                  <td>{s.title}</td>
                  <td>{s.company}</td>
                  <td>{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
