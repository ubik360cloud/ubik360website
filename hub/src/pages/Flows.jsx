import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Flows() {
  const [flows, setFlows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [segment, setSegment] = useState(null);
  const [steps, setSteps] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newFlow, setNewFlow] = useState({ track: 'ic', name: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [enrollResult, setEnrollResult] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [testingStep, setTestingStep] = useState(null);
  const [testMsg, setTestMsg] = useState({});

  async function load() {
    try { const { flows: f } = await api.flows(); setFlows(f); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  // Coming from "Draft flow for this segment" on the Apollo tab lands here
  // with ?open=<flowId> so the new draft opens directly instead of leaving
  // Jose to find it in the list himself.
  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId) { openFlow({ id: openId }); setSearchParams({}, { replace: true }); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function openFlow(f) {
    setEnrollResult(null);
    const { flow, steps: s, segment: seg } = await api.flow(f.id);
    setSelected(flow);
    setSegment(seg);
    setSteps(s.length ? s : [{ step_no: 1, delay_hours: 0, subject: '', body: '', cta_url: '' }]);
  }

  async function enrollSegmentNow() {
    setBusy(true); setError(null);
    try { const r = await api.enrollSegment(selected.id, segment.id); setEnrollResult(r); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function createFlow() {
    if (!newFlow.name.trim()) return;
    setBusy(true);
    try { await api.createFlow(newFlow); setCreating(false); setNewFlow({ track: 'ic', name: '' }); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  function updateStep(i, field, value) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }
  function addStep() {
    setSteps((prev) => [...prev, { step_no: prev.length + 1, delay_hours: 72, subject: '', body: '', cta_url: '' }]);
  }

  async function saveSteps() {
    setBusy(true); setError(null);
    try { await api.setFlowSteps(selected.id, steps); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function activate() {
    setBusy(true); setError(null);
    try {
      await saveSteps();
      await api.updateFlow(selected.id, { status: 'active' });
      await openFlow(selected);
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  // Saves first so the test reflects whatever's currently in the form, not
  // whatever was last saved -- otherwise a test-send while mid-edit would
  // silently mail the OLD copy from the database, not what's on screen.
  async function sendTest(i) {
    setTestingStep(i);
    setError(null);
    setTestMsg((m) => ({ ...m, [i]: null }));
    try {
      await saveSteps();
      const r = await api.testSendFlowStep(selected.id, steps[i].step_no);
      setTestMsg((m) => ({ ...m, [i]: `Sent to ${r.to}` }));
    } catch (e) {
      setError(e.message);
    } finally {
      setTestingStep(null);
    }
  }

  async function pause() {
    setBusy(true);
    try { await api.updateFlow(selected.id, { status: 'paused' }); await openFlow(selected); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  if (selected) {
    return (
      <div>
        <button className="btn btn-outline" onClick={() => setSelected(null)} style={{ marginBottom: '1rem' }}>&larr; Back to flows</button>
        <h1 style={{ fontSize: '1.375rem' }}>{selected.name} <span className={`badge badge-${selected.track}`}>{selected.track}</span> <span className="badge">{selected.status}</span></h1>
        {selected.description && <p style={{ color: '#6b7280', marginTop: '-.5rem' }}>{selected.description}</p>}

        {segment && (
          <div className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '.8125rem', color: '#6b7280' }}>Segment</p>
              <p style={{ margin: '.25rem 0 0' }}>
                <span className="badge">{segment.label || 'weekly plan'}</span> — {segment.counts?.imported ?? 0} imported contacts
              </p>
              {segment.brief && <p style={{ fontSize: '.8125rem', color: '#374151', marginTop: '.25rem' }}>{segment.brief}</p>}
            </div>
            <button className="btn btn-primary" disabled={busy || selected.status !== 'active'} onClick={enrollSegmentNow} title={selected.status !== 'active' ? 'Approve & activate the flow first' : ''}>
              Enroll segment into this flow
            </button>
          </div>
        )}
        {segment && selected.status !== 'active' && (
          <p style={{ fontSize: '.8125rem', color: '#6b7280', marginTop: '-.5rem' }}>
            Approve &amp; activate the flow below before enrolling -- enrolling into a draft flow
            would miss the send once you do activate it.
          </p>
        )}
        {enrollResult && (
          <p style={{ fontSize: '.8125rem', color: '#374151' }}>
            Enrolled {enrollResult.enrolled} of {enrollResult.total} contact{enrollResult.total === 1 ? '' : 's'}
            {enrollResult.skipped?.length > 0 && ` (skipped: ${enrollResult.skipped.join(', ')})`}.
          </p>
        )}

        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
        {steps.map((s, i) => (
          <div key={i} className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '.75rem', marginBottom: '.5rem', alignItems: 'center' }}>
              <strong>Step {s.step_no}</strong>
              <label style={{ fontSize: '.8125rem', color: '#6b7280' }}>
                delay (hours after previous):{' '}
                <input type="number" value={s.delay_hours} onChange={(e) => updateStep(i, 'delay_hours', Number(e.target.value))} style={{ width: 80, display: 'inline-block' }} />
              </label>
            </div>
            <input placeholder="Subject" defaultValue={s.subject} onChange={(e) => updateStep(i, 'subject', e.target.value)} style={{ marginBottom: '.5rem' }} />
            <textarea placeholder="Body" rows={6} defaultValue={s.body} onChange={(e) => updateStep(i, 'body', e.target.value)} style={{ marginBottom: '.5rem' }} />
            <input placeholder="CTA URL (optional)" defaultValue={s.cta_url || ''} onChange={(e) => updateStep(i, 'cta_url', e.target.value)} style={{ marginBottom: '.5rem' }} />
            <p style={{ fontSize: '.75rem', color: '#6b7280', margin: '0 0 .5rem' }}>
              The CTA URL is appended as its own plain line after the body (most email clients
              auto-link it -- there's no styled button). No signature is added automatically
              except the compliance opt-out footer -- include your own sign-off in the body if you
              want one.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <button className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.15rem .5rem' }} disabled={testingStep === i} onClick={() => sendTest(i)}>
                {testingStep === i ? 'Sending...' : 'Send test to me'}
              </button>
              {testMsg[i] && <span style={{ fontSize: '.75rem', color: '#6b7280' }}>{testMsg[i]}</span>}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="btn btn-outline" onClick={addStep}>+ Add step</button>
          <button className="btn btn-outline" disabled={busy} onClick={saveSteps}>Save steps</button>
          {selected.status !== 'active' ? (
            <button className="btn btn-primary" disabled={busy} onClick={activate}>Approve &amp; activate</button>
          ) : (
            <button className="btn btn-outline" disabled={busy} onClick={pause}>Pause</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.375rem', margin: 0 }}>Flows</h1>
        <button className="btn btn-primary" onClick={() => setCreating((v) => !v)}>+ New flow</button>
      </div>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {creating && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <select value={newFlow.track} onChange={(e) => setNewFlow((f) => ({ ...f, track: e.target.value }))} style={{ width: 'auto' }}>
            <option value="ic">ic</option>
            <option value="b2b">b2b</option>
          </select>
          <input placeholder="Flow name" value={newFlow.name} onChange={(e) => setNewFlow((f) => ({ ...f, name: e.target.value }))} />
          <button className="btn btn-primary" disabled={busy} onClick={createFlow}>Create</button>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {flows.map((f) => (
          <button key={f.id} className="card" style={{ textAlign: 'left', cursor: 'pointer', border: 'none', display: 'flex', justifyContent: 'space-between' }} onClick={() => openFlow(f)}>
            <span><span className={`badge badge-${f.track}`}>{f.track}</span> {f.name}</span>
            <span className="badge">{f.status}</span>
          </button>
        ))}
        {!flows.length && <p>No flows yet.</p>}
      </div>
    </div>
  );
}
