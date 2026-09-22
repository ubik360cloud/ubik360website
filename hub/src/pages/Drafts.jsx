import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function Drafts() {
  const [drafts, setDrafts] = useState([]);
  const [editing, setEditing] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try { const { oneoffs } = await api.oneoffs({ status: 'pending' }); setDrafts(oneoffs); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

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

  async function reject(d) {
    setBusyId(d.id); setError(null);
    try { await api.updateOneoff(d.id, { status: 'rejected' }); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusyId(null); }
  }

  async function sendNow(d) {
    if (!window.confirm(`Send to ${d.contacts.email}?`)) return;
    setBusyId(d.id); setError(null);
    try {
      await saveIfEdited(d);
      if (d.status !== 'approved') await api.updateOneoff(d.id, { status: 'approved' });
      await api.sendOneoff(d.id);
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusyId(null); }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.375rem', marginBottom: '1rem' }}>1:1 draft queue</h1>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {!drafts.length && <p>No pending drafts.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {drafts.map((d) => (
          <div key={d.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
              <div>
                <span className={`badge badge-${d.track}`}>{d.track}</span>{' '}
                <strong>{d.contacts?.company}</strong> — {d.contacts?.email}
              </div>
              {d.research && (
                <span className="badge" title={d.research.why}>fit: {d.research.fit} ({d.research.confidence})</span>
              )}
            </div>
            {d.research?.why && <p style={{ fontSize: '.8125rem', color: '#6b7280', margin: '0 0 .75rem' }}>{d.research.why}</p>}
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
