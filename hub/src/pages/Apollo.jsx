import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const TRACKS = ['ic', 'b2b'];

// Renders one plan card -- the standard weekly plan (no label) or a
// custom-labeled test campaign, both use the same propose -> approve (pulls
// from Apollo, spends credits) -> review staged -> stage-approve (imports)
// pipeline, just scoped per-plan instead of per-track so several can run
// side by side (see CLAUDE.md Growth Hub section).
function PlanCard({ plan, onChange }) {
  const [staged, setStaged] = useState([]);
  const [excluded, setExcluded] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  async function loadStaged() {
    if (!['staged', 'enrolling', 'completed'].includes(plan.status)) return;
    try {
      const { staged: s } = await api.weeklyPlanStaged(plan.id);
      setStaged(s);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { loadStaged(); }, [plan.id, plan.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function approve() {
    setBusy(true);
    setError(null);
    try { await api.approveWeeklyPlan(plan.id); onChange(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function stageApprove() {
    setBusy(true);
    setError(null);
    try { await api.stageApprove(plan.id, [...excluded]); setExcluded(new Set()); onChange(); }
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
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <span className="badge">{plan.status}</span>
          {plan.label && <span className="badge" style={{ marginLeft: '.5rem' }}>{plan.label}</span>}
          <p style={{ margin: '.5rem 0 0' }}>{plan.rationale}</p>
          {plan.brief && <p style={{ fontSize: '.8125rem', color: '#374151', marginTop: '.25rem' }}>{plan.brief}</p>}
          <p style={{ fontSize: '.8125rem', color: '#6b7280' }}>
            Week of {plan.week_of} · target {plan.filter?.target}
            {plan.counts?.staged != null && ` · ${plan.counts.staged} staged`}
            {plan.counts?.imported != null && ` · ${plan.counts.imported} imported`}
          </p>
          <button className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.15rem .5rem', marginTop: '.25rem' }} onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'hide filter' : 'show filter'}
          </button>
          {expanded && (
            <pre style={{ fontSize: '.75rem', background: '#f9fafb', padding: '.5rem', marginTop: '.25rem', overflowX: 'auto' }}>
              {JSON.stringify(plan.filter, null, 2)}
            </pre>
          )}
        </div>
        {plan.status === 'proposed' && (
          <button className="btn btn-primary" disabled={busy} onClick={approve}>
            Approve &amp; pull from Apollo (spends credits)
          </button>
        )}
      </div>

      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      {staged.length > 0 && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid #f3f4f6', paddingTop: '.75rem' }}>
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

export default function Apollo() {
  const [track, setTrack] = useState('ic');
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const { plans: p } = await api.weeklyPlans(track);
      setPlans(p);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, [track]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 style={{ fontSize: '1.375rem', marginBottom: '1rem' }}>Apollo — weekly &amp; custom plans</h1>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
        {TRACKS.map((t) => (
          <button key={t} className={track === t ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTrack(t)}>{t}</button>
        ))}
      </div>

      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {plans.length === 0 && <p>No plans proposed yet for this track. The standard weekly plan proposes itself every Friday; a custom test campaign (like a specific geography or industry angle) is created directly for now -- ask Claude Code to set one up with a label and brief.</p>}

      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} onChange={load} />
      ))}
    </div>
  );
}
