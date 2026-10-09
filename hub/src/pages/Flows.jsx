import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { previewFlowStep } from '../lib/emailPreview.js';

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
  const [instructions, setInstructions] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedDescription, setSuggestedDescription] = useState(null);
  const [otherSegments, setOtherSegments] = useState([]);
  const [otherChoice, setOtherChoice] = useState('');
  const [enrollmentCounts, setEnrollmentCounts] = useState({});
  // Step cards use uncontrolled inputs (defaultValue) for editing
  // performance -- bumping this forces them to remount (fresh defaultValue)
  // whenever `steps` is replaced wholesale (opening a flow, an AI
  // suggestion) rather than edited in place, since React would otherwise
  // reuse the existing DOM nodes by index and never show the new content.
  const [stepsVersion, setStepsVersion] = useState(0);

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
    setInstructions('');
    setSuggestedDescription(null);
    const { flow, steps: s, segment: seg, enrollmentCounts: ec } = await api.flow(f.id);
    setEnrollmentCounts(ec || {});
    setOtherChoice('');
    // Other finished segments of this track that can also feed this flow.
    api.weeklyPlans(flow.track, { status: 'completed', page: 1, pageSize: 50 })
      .then(({ plans }) => setOtherSegments((plans || []).filter((p) => p.id !== flow.source_plan_id)))
      .catch(() => setOtherSegments([]));
    setSelected(flow);
    setSegment(seg);
    setSteps(s.length ? s : [{ step_no: 1, delay_hours: 0, subject: '', body: '', cta_url: '' }]);
    setStepsVersion((v) => v + 1);
  }

  // Lets Jose describe how he wants THIS flow to look (tone, structure,
  // specific points to hit or avoid) right here on the Flows page, instead
  // of only being able to draft a flow from the Apollo tab at creation
  // time. Populates the step editor below with the result -- nothing is
  // saved until he clicks "Save steps" himself, same review gate as any
  // other edit.
  async function suggestWithAI() {
    setSuggesting(true);
    setError(null);
    try {
      const s = await api.suggestForFlow(selected.id, instructions);
      if (s.steps?.length) { setSteps(s.steps); setStepsVersion((v) => v + 1); setTestMsg({}); }
      setSuggestedDescription(s.description || null);
      // The suggestion computes language from the segment's geography (or
      // 'en' with none linked) -- save it immediately rather than leaving
      // it to a separate step, since the signature/opt-out footer at send
      // time depend on this being right.
      if (s.language && s.language !== selected.language) {
        await api.updateFlow(selected.id, { language: s.language });
        setSelected((prev) => ({ ...prev, language: s.language }));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSuggesting(false);
    }
  }

  async function changeLanguage(language) {
    setSelected((prev) => ({ ...prev, language }));
    try { await api.updateFlow(selected.id, { language }); }
    catch (e) { setError(e.message); }
  }

  async function enrollSegmentNow(planId = segment?.id) {
    setBusy(true); setError(null);
    try {
      const r = await api.enrollSegment(selected.id, planId);
      setEnrollResult(r);
      const fresh = await api.flow(selected.id);
      setEnrollmentCounts(fresh.enrollmentCounts || {});
    }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function createFlow() {
    if (!newFlow.name.trim()) return;
    setBusy(true);
    try {
      const { flow } = await api.createFlow(newFlow);
      setCreating(false);
      setNewFlow({ track: 'ic', name: '' });
      await load();
      // Open it immediately -- the AI context box and step editor only
      // live inside an opened flow, not on this list/creation screen, so
      // staying here after creating one hid the exact thing Jose was
      // looking for.
      await openFlow(flow);
    } catch (e) { setError(e.message); }
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
        <h1 style={{ fontSize: '1.375rem' }}>
          {selected.name} <span className={`badge badge-${selected.track}`}>{selected.track}</span> <span className="badge">{selected.status}</span>{' '}
          <select value={selected.language || 'en'} onChange={(e) => changeLanguage(e.target.value)} style={{ width: 'auto', display: 'inline-block', fontSize: '.8125rem' }}>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </h1>
        {selected.description && <p style={{ color: '#6b7280', marginTop: '-.5rem' }}>{selected.description}</p>}
        <p style={{ fontSize: '.75rem', color: '#6b7280', marginTop: '-.75rem', marginBottom: '1rem' }}>
          Language controls the auto-appended signature and opt-out footer's language at send
          time -- set automatically from the segment when you draft with AI, override here if a
          step gets hand-edited into the other language.
        </p>

        {segment && (
          <div className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '.8125rem', color: '#6b7280' }}>Segment</p>
              <p style={{ margin: '.25rem 0 0' }}>
                <span className="badge">{segment.label || 'weekly plan'}</span> — {segment.counts?.imported ?? 0} imported contacts
              </p>
              {segment.brief && <p style={{ fontSize: '.8125rem', color: '#374151', marginTop: '.25rem' }}>{segment.brief}</p>}
              {(() => {
                const total = Object.values(enrollmentCounts).reduce((a, b) => a + b, 0);
                const imported = segment.counts?.imported ?? 0;
                const parts = Object.entries(enrollmentCounts).map(([st, n]) => `${n} ${st}`).join(', ');
                return (
                  <p style={{ fontSize: '.8125rem', color: '#374151', margin: '.25rem 0 0' }}>
                    <strong>In this flow:</strong> {total > 0 ? parts : 'nobody enrolled yet'}.{' '}
                    {total >= imported && imported > 0
                      ? 'Everyone in this segment has been through enrollment already.'
                      : selected.status === 'active'
                        ? 'Use "Enroll segment into this flow" to add the rest (anyone already enrolled is skipped).'
                        : 'Approve & activate the flow first, then enroll.'}
                    {enrollmentCounts.stopped > 0 && ' "Stopped" = left out on purpose (suppressed, wrong language for this flow, or over the 2-per-company limit).'}
                  </p>
                );
              })()}
              {segment.language_counts && (segment.language_counts.es + segment.language_counts.en > 0) && (
                <p style={{ fontSize: '.75rem', color: '#6b7280', marginTop: '.25rem', marginBottom: 0 }}>
                  Contacts by language (from their country): {segment.language_counts.es} Spanish, {segment.language_counts.en} English.
                  {(() => {
                    const majority = segment.language_counts.es > segment.language_counts.en ? 'es' : 'en';
                    const mixed = segment.language_counts.es > 0 && segment.language_counts.en > 0;
                    if (selected.language !== majority) return <strong style={{ color: '#b91c1c' }}> This flow is set to {selected.language === 'es' ? 'Spanish' : 'English'} but most contacts need {majority === 'es' ? 'Spanish' : 'English'} -- fix the language selector above.</strong>;
                    if (mixed) return <strong style={{ color: '#92400e' }}> This segment mixes both languages -- the flow can only send one; consider splitting it.</strong>;
                    return null;
                  })()}
                </p>
              )}
            </div>
            <button className="btn btn-primary" disabled={busy || selected.status !== 'active'} onClick={() => enrollSegmentNow()} title={selected.status !== 'active' ? 'Approve & activate the flow first' : ''}>
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
        {selected.status === 'active' && otherSegments.length > 0 && (
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <select value={otherChoice} onChange={(e) => setOtherChoice(e.target.value)} style={{ width: 'auto', fontSize: '.8125rem' }}>
              <option value="">Enroll another segment into this flow...</option>
              {otherSegments.map((p) => <option key={p.id} value={p.id}>{p.label || `${p.track} weekly plan (week of ${p.week_of})`} ({p.counts?.imported ?? 0} contacts)</option>)}
            </select>
            <button className="btn btn-outline" disabled={!otherChoice || busy} onClick={() => enrollSegmentNow(otherChoice)}>Enroll</button>
          </div>
        )}
        {enrollResult && (
          <p style={{ fontSize: '.8125rem', color: '#374151' }}>
            Enrolled {enrollResult.enrolled} of {enrollResult.total} contact{enrollResult.total === 1 ? '' : 's'}
            {enrollResult.skipped?.length > 0 && ` (skipped: ${Object.entries(enrollResult.skipped.reduce((m, r) => ({ ...m, [r]: (m[r] || 0) + 1 }), {})).map(([r, n]) => `${n} ${r}`).join(', ')})`}.
          </p>
        )}

        <div className="card" style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 .5rem', fontSize: '.8125rem', color: '#374151' }}>
            Context for this flow — tone, structure, specific points to include or avoid, anything
            beyond the segment's own targeting
          </p>
          <textarea
            rows={3}
            style={{ width: '100%', fontSize: '.8125rem', padding: '.5rem', boxSizing: 'border-box', marginBottom: '.5rem' }}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Keep it to 2 short steps, lead with the logistics angle not marketing, no mention of pricing."
          />
          <button className="btn btn-primary" disabled={suggesting || !instructions.trim()} onClick={suggestWithAI}>
            {suggesting ? 'Drafting...' : 'Suggest steps with AI'}
          </button>
          {suggestedDescription && <p style={{ fontSize: '.8125rem', color: '#6b7280', marginTop: '.5rem' }}>{suggestedDescription}</p>}
        </div>

        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
        {steps.map((s, i) => (
          <div key={`${stepsVersion}-${i}`} className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '.75rem', marginBottom: '.5rem', alignItems: 'center' }}>
              <strong>Step {s.step_no}</strong>
              <label style={{ fontSize: '.8125rem', color: '#6b7280' }}>
                delay (hours after previous):{' '}
                <input type="number" value={s.delay_hours} onChange={(e) => updateStep(i, 'delay_hours', Number(e.target.value))} style={{ width: 80, display: 'inline-block' }} />
              </label>
            </div>
            <input placeholder="Subject" defaultValue={s.subject} onChange={(e) => updateStep(i, 'subject', e.target.value)} style={{ marginBottom: '.5rem' }} />
            <textarea placeholder="Body" rows={6} defaultValue={s.body} onChange={(e) => updateStep(i, 'body', e.target.value)} style={{ marginBottom: '.5rem' }} />
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.5rem' }}>
              <input placeholder="CTA label (optional, e.g. Let's Talk)" defaultValue={s.cta_label || ''} onChange={(e) => updateStep(i, 'cta_label', e.target.value)} style={{ flex: '0 0 40%' }} />
              <input placeholder="CTA URL (optional)" defaultValue={s.cta_url || ''} onChange={(e) => updateStep(i, 'cta_url', e.target.value)} style={{ flex: 1 }} />
            </div>
            <p style={{ fontSize: '.75rem', color: '#6b7280', margin: '0 0 .5rem' }}>
              Start the body with a real greeting using <code>{'{{first_name}}'}</code> (e.g. "Hola
              {'{{first_name}}'},") -- it's replaced with each contact's actual first name when it
              sends, or dropped gracefully if one isn't on file. The CTA appears as "label: url" on
              its own plain line (no styled button -- these are plain-text emails). Don't write your
              own sign-off in the body -- the signature and opt-out shown in the preview below are
              added automatically at send time, writing one yourself would double it up.
            </p>
            <details open style={{ marginBottom: '.5rem' }}>
              <summary style={{ fontSize: '.75rem', color: '#6b7280', cursor: 'pointer' }}>
                Preview -- exactly what this step will send
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
                {previewFlowStep({ body: s.body, ctaLabel: s.cta_label, ctaUrl: s.cta_url, language: selected.language })}
              </pre>
            </details>
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
