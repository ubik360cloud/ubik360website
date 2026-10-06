import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { previewOneoff } from '../lib/emailPreview.js';

// Keep in sync with VALID_BUSINESS_UNITS in api/growth/_handlers/oneoffs.js
// and the positioning briefs' "Output note" sections.
const ANGLES = {
  b2b: [
    ['growth_marketing', 'Growth marketing / fractional CMO'],
    ['nearshore_staffing', 'Nearshore staffing'],
    ['international_expansion', 'International expansion (Colombia)'],
    ['ecommerce_growth', 'Ecommerce growth'],
    ['agency_subcontracting', 'Agency subcontracting (white-label)'],
    ['manufacturing_ops_tooling', 'Ops tooling & systems integration (manufacturing)'],
  ],
  ic: [
    ['marketplace_launch', 'Marketplace launch & brand building'],
    ['multichannel_scaling', 'Multi-channel ecommerce scaling'],
    ['meta_ads', 'Meta Ads management'],
    ['ops_automation', 'Ecommerce ops & automation'],
  ],
};

export default function Drafts() {
  const [drafts, setDrafts] = useState([]);
  const [editing, setEditing] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [pulling, setPulling] = useState(false);
  const [pullResult, setPullResult] = useState(null);
  const [lastSent, setLastSent] = useState(null);
  const [angle, setAngle] = useState({});
  // Subject/body are uncontrolled (defaultValue) -- bumping a draft's
  // version remounts its card so a redraft's new text actually shows up.
  const [versions, setVersions] = useState({});

  async function load() {
    try { const { oneoffs } = await api.oneoffs({ status: 'pending' }); setDrafts(oneoffs); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  // This queue is normally filled by a daily cron (draft ~5 fresh leads
  // per track) -- this button runs the exact same function on demand, for
  // testing or because the cron's own reliability is a separate open
  // question. Only drafts contacts that haven't been through this queue
  // before (no duplicate drafts for the same contact).
  async function pullNow() {
    setPulling(true);
    setError(null);
    setPullResult(null);
    try {
      const { results } = await api.pullOneoffsNow();
      setPullResult(results);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setPulling(false);
    }
  }

  function edit(id, field, value) {
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function saveIfEdited(d) {
    const e = editing[d.id];
    if (!e) return;
    await api.updateOneoff(d.id, e);
  }

  async function approve(d) {
    setBusyId(d.id); setError(null);
    try { await saveIfEdited(d); await api.updateOneoff(d.id, { status: 'approved' }); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusyId(null); }
  }

  async function redraft(d) {
    const unit = angle[d.id] || d.research?.business_unit;
    if (!unit) return;
    if (editing[d.id]?.body || editing[d.id]?.subject) {
      if (!window.confirm('Redrafting replaces your unsaved edits to this draft. Continue?')) return;
    }
    setBusyId(d.id); setError(null);
    try {
      await api.redraftOneoff(d.id, unit);
      setEditing((prev) => { const { [d.id]: _drop, ...rest } = prev; return rest; });
      setVersions((v) => ({ ...v, [d.id]: (v[d.id] || 0) + 1 }));
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusyId(null); }
  }

  async function reject(d) {
    setBusyId(d.id); setError(null);
    try { await api.updateOneoff(d.id, { status: 'rejected' }); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusyId(null); }
  }

  async function sendNow(d) {
    if (!window.confirm(`Send to ${d.contacts.email}?`)) return;
    setBusyId(d.id); setError(null); setLastSent(null);
    try {
      await saveIfEdited(d);
      if (d.status !== 'approved') await api.updateOneoff(d.id, { status: 'approved' });
      await api.sendOneoff(d.id);
      // The sent draft disappears from this list on the next load() (only
      // pending ones are fetched) -- without this, a successful send looked
      // identical to a silent no-op, since nothing stayed on screen to
      // confirm it actually went out.
      setLastSent({ email: d.contacts.email, company: d.contacts?.company });
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusyId(null); }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.375rem', margin: 0 }}>1:1 draft queue</h1>
        <button className="btn btn-outline" disabled={pulling} onClick={pullNow}>
          {pulling ? 'Researching...' : 'Pull fresh leads now'}
        </button>
      </div>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {lastSent && (
        <p style={{ fontSize: '.8125rem', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, padding: '.5rem .75rem' }}>
          Sent to {lastSent.email}{lastSent.company ? ` (${lastSent.company})` : ''}.{' '}
          <button
            onClick={() => setLastSent(null)}
            style={{ background: 'none', border: 'none', color: '#166534', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
          >
            dismiss
          </button>
        </p>
      )}
      {pullResult && (
        <p style={{ fontSize: '.8125rem', color: '#6b7280' }}>
          {Object.entries(pullResult).map(([track, r]) => (
            <span key={track} style={{ marginRight: '1rem' }}>
              {track}: {r.error ? `error (${r.error})` : `${r.drafted} drafted, ${r.skipped} skipped`}
            </span>
          ))}
        </p>
      )}
      {!drafts.length && (
        <p>
          No pending drafts. This queue normally fills itself daily (a cron researches ~5 fresh
          leads per track and drafts a personalized email for each) -- click "Pull fresh leads now"
          above to run that immediately instead of waiting.
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {drafts.map((d) => (
          <div key={`${d.id}-${versions[d.id] || 0}`} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
              <div>
                <span className={`badge badge-${d.track}`}>{d.track}</span>{' '}
                <strong>{d.contacts?.company}</strong> — {d.contacts?.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                {d.research && (
                  <span className="badge" title={d.research.why}>fit: {d.research.fit} ({d.research.confidence})</span>
                )}
                <select
                  defaultValue={d.language || 'en'}
                  onChange={(e) => edit(d.id, 'language', e.target.value)}
                  title="Controls the auto-appended signature/opt-out footer's language at send time"
                  style={{ width: 'auto', fontSize: '.75rem' }}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
            {d.research?.why && <p style={{ fontSize: '.8125rem', color: '#6b7280', margin: '0 0 .5rem' }}>{d.research.why}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
              <label style={{ fontSize: '.75rem', color: '#6b7280' }}>Service pitch:</label>
              <select
                value={angle[d.id] ?? d.research?.business_unit ?? ''}
                onChange={(e) => setAngle((a) => ({ ...a, [d.id]: e.target.value }))}
                style={{ width: 'auto', fontSize: '.75rem' }}
              >
                <option value="" disabled>Pick an angle...</option>
                {(ANGLES[d.track] || []).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button
                className="btn btn-outline"
                style={{ fontSize: '.75rem', padding: '.15rem .5rem' }}
                disabled={busyId === d.id || !(angle[d.id] || ANGLES[d.track]?.some(([v]) => v === d.research?.business_unit))}
                onClick={() => redraft(d)}
                title="Rewrites this draft around the selected service, replacing the current subject and body"
              >
                {busyId === d.id ? 'Working...' : 'Redraft with this angle'}
              </button>
            </div>
            <input
              defaultValue={d.subject || ''}
              placeholder="Subject"
              onChange={(e) => edit(d.id, 'subject', e.target.value)}
              style={{ marginBottom: '.5rem' }}
            />
            <textarea
              defaultValue={d.body || ''}
              placeholder="Body"
              rows={8}
              onChange={(e) => edit(d.id, 'body', e.target.value)}
            />
            <details open style={{ marginTop: '.5rem' }}>
              <summary style={{ fontSize: '.75rem', color: '#6b7280', cursor: 'pointer' }}>
                Preview -- exactly what this will send
              </summary>
              <pre
                style={{
                  fontSize: '.8125rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 4,
                  padding: '.75rem',
                  marginTop: '.5rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                }}
              >
                {previewOneoff({ body: editing[d.id]?.body ?? d.body, language: editing[d.id]?.language ?? d.language })}
              </pre>
            </details>
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem' }}>
              <button className="btn btn-primary" disabled={busyId === d.id} onClick={() => sendNow(d)}>Send now</button>
              <button className="btn btn-outline" disabled={busyId === d.id} onClick={() => approve(d)}>Approve (don't send yet)</button>
              <button className="btn btn-outline" disabled={busyId === d.id} onClick={() => reject(d)}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
