import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

const TRACKS = ['ic', 'b2b'];
const ACTIVE_STATUSES = 'proposed,approved,pulling,staged,enrolling';

async function draftFlowFor(plan, navigate) {
  const suggestion = await api.suggestFlowForPlan(plan.id);
  const { flow } = await api.createFlow({
    track: plan.track,
    name: suggestion.name || `${plan.label || plan.track} flow`,
    description: suggestion.description,
    source_plan_id: plan.id,
  });
  if (suggestion.steps?.length) await api.setFlowSteps(flow.id, suggestion.steps);
  navigate(`/flows?open=${flow.id}`);
}

// A plan still needing a decision (approve the pull, or review/import the
// staged candidates) -- the small number of these at any time get the full
// card. Once a plan reaches 'completed' it's already been decided and moves
// to the compact CompletedPlansTable below instead.
function PlanCard({ plan, onChange }) {
  const [staged, setStaged] = useState([]);
  // Tracks who's INCLUDED for import (checked = will be imported), not who's
  // excluded -- a prior version inverted this (checkbox meant "exclude") and
  // it read as "click each contact to select it," so checking every row
  // actually rejected everyone. Defaults to everyone included, matching "I
  // reviewed this list and it looks right" being the common case.
  const [included, setIncluded] = useState(new Set());

  useEffect(() => { setIncluded(new Set(staged.map((s) => s.id))); }, [staged]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  async function loadStaged() {
    if (plan.status !== 'staged') return;
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
    const excludeIds = staged.filter((s) => !included.has(s.id)).map((s) => s.id);
    if (included.size === 0) {
      const ok = window.confirm(`This will REJECT all ${staged.length} candidates and import none. Continue?`);
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    try { await api.stageApprove(plan.id, excludeIds); onChange(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  function toggleInclude(id) {
    setIncluded((prev) => {
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

      {plan.status === 'staged' && staged.length > 0 && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid #f3f4f6', paddingTop: '.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <h2 style={{ fontSize: '1rem', margin: 0 }}>Staged candidates ({staged.length})</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <button className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.15rem .5rem' }} onClick={() => setIncluded(new Set(staged.map((s) => s.id)))}>
                select all
              </button>
              <button className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.15rem .5rem' }} onClick={() => setIncluded(new Set())}>
                select none
              </button>
              <button className="btn btn-primary" disabled={busy} onClick={stageApprove}>
                Import {included.size} contact{included.size === 1 ? '' : 's'}
                {included.size < staged.length && ` (reject ${staged.length - included.size})`}
              </button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8125rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                <th>Import?</th><th>Name</th><th>Title</th><th>Company</th><th>Email</th>
              </tr>
            </thead>
            <tbody>
              {staged.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid #f3f4f6', opacity: included.has(s.id) ? 1 : 0.4 }}>
                  <td><input type="checkbox" checked={included.has(s.id)} onChange={() => toggleInclude(s.id)} title="Import this contact" /></td>
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

// Already-decided plans (imported/rejected done) -- this list only ever
// grows as more campaigns run, so it's a compact table with pagination
// instead of the full card every other status gets. One line per segment:
// label, how many contacts it actually produced, when, and the one action
// still worth taking from here (draft a flow for it).
function CompletedPlansTable({ track }) {
  const [plans, setPlans] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [draftingId, setDraftingId] = useState(null);
  const [activeFlows, setActiveFlows] = useState([]);
  const [linkChoice, setLinkChoice] = useState({}); // planId -> flowId picked in the dropdown
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrollMsg, setEnrollMsg] = useState({}); // planId -> last enroll result text
  const navigate = useNavigate();
  const pageSize = 10;

  async function load() {
    setError(null);
    try {
      const [{ plans: p, total: t }, { flows: f }] = await Promise.all([
        api.weeklyPlans(track, { status: 'completed', page, pageSize }),
        api.flows({ track }),
      ]);
      setPlans(p);
      setTotal(t);
      setActiveFlows((f || []).filter((fl) => fl.status === 'active'));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, [track, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Routes a segment that already finished (imported/rejected) into an
  // EXISTING flow instead of drafting a new one -- this is how "add more
  // contacts to the same campaign" actually works: each Apollo pull creates
  // its own plan/segment, but any number of segments can feed the same
  // flow. enrollSegment only touches contacts tagged with THIS plan's id,
  // so it's safe to run for a new segment without re-touching contacts
  // already enrolled from an earlier one.
  async function enrollIntoExisting(plan) {
    const flowId = linkChoice[plan.id];
    if (!flowId) return;
    setEnrollingId(plan.id);
    setError(null);
    try {
      const r = await api.enrollSegment(flowId, plan.id);
      setEnrollMsg((m) => ({ ...m, [plan.id]: `Enrolled ${r.enrolled} of ${r.total}` }));
    } catch (e) {
      setError(e.message);
    } finally {
      setEnrollingId(null);
    }
  }

  async function draftFlow(plan) {
    setDraftingId(plan.id);
    setError(null);
    try { await draftFlowFor(plan, navigate); }
    catch (e) { setError(e.message); }
    finally { setDraftingId(null); }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  return (
    <div className="card">
      <h2 style={{ fontSize: '1rem', marginTop: 0 }}>Completed segments ({total})</h2>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8125rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#6b7280' }}>
            <th style={{ padding: '.3rem 0' }}>Segment</th><th># contacts</th><th>Created on</th><th colSpan={2}></th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} style={{ borderTop: '1px solid #f3f4f6' }}>
              <td style={{ padding: '.4rem 0' }}>{plan.label || `${plan.track} weekly plan`}</td>
              <td>{plan.counts?.imported ?? 0}</td>
              <td>{new Date(plan.created_at).toLocaleDateString()}</td>
              <td style={{ textAlign: 'right' }}>
                <button className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.15rem .5rem' }} disabled={draftingId === plan.id} onClick={() => draftFlow(plan)}>
                  {draftingId === plan.id ? 'Drafting...' : plan.flow_id ? 'Draft another flow' : 'Draft flow'}
                </button>
              </td>
              <td style={{ textAlign: 'right' }}>
                {activeFlows.length > 0 && (
                  <div style={{ display: 'flex', gap: '.25rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <select
                      style={{ fontSize: '.75rem', padding: '.15rem' }}
                      value={linkChoice[plan.id] || ''}
                      onChange={(e) => setLinkChoice((c) => ({ ...c, [plan.id]: e.target.value }))}
                    >
                      <option value="">Enroll into existing flow...</option>
                      {activeFlows.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '.75rem', padding: '.15rem .5rem' }}
                      disabled={!linkChoice[plan.id] || enrollingId === plan.id}
                      onClick={() => enrollIntoExisting(plan)}
                    >
                      {enrollingId === plan.id ? 'Enrolling...' : 'Go'}
                    </button>
                  </div>
                )}
                {enrollMsg[plan.id] && <span style={{ fontSize: '.75rem', color: '#6b7280' }}>{enrollMsg[plan.id]}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '.75rem', marginTop: '.75rem' }}>
          <button className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.15rem .5rem' }} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>&larr; Prev</button>
          <span style={{ fontSize: '.8125rem', color: '#6b7280' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.15rem .5rem' }} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next &rarr;</button>
        </div>
      )}
    </div>
  );
}

// Free-text context in, an editable filter proposal out -- what Jose asked
// for after several rounds of describing a target in chat and Claude Code
// hand-writing the Apollo filter each time. Nothing here costs Apollo
// credits: "Suggest" calls DeepInfra only, "Preview" calls only Apollo's
// free search. Only "Create plan" writes anything, and even that doesn't
// spend credits -- credits are spent on the resulting plan's own "Approve"
// button, same as any other plan card.
function NewPlanForm({ track, onCreated }) {
  const [brief, setBrief] = useState('');
  const [label, setLabel] = useState('');
  const [target, setTarget] = useState(10);
  const [filterText, setFilterText] = useState('');
  const [rationale, setRationale] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(null); // 'suggest' | 'preview' | 'create' | null
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  function parsedFilter() {
    try { return JSON.parse(filterText || '{}'); }
    catch { throw new Error('The filter box has invalid JSON -- fix the syntax before continuing.'); }
  }

  async function suggest() {
    setBusy('suggest'); setError(null); setPreview(null);
    try {
      let prior;
      try { prior = filterText ? parsedFilter() : undefined; } catch { prior = undefined; }
      const s = await api.suggestFilter(track, brief, prior);
      setLabel(s.label || label);
      setTarget(s.target || 10);
      setFilterText(JSON.stringify(s.filter || {}, null, 2));
      setRationale(s.rationale || '');
    } catch (e) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function runPreview() {
    setBusy('preview'); setError(null);
    try {
      const filter = parsedFilter();
      const p = await api.previewFilter(filter, 100);
      setPreview(p);
    } catch (e) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function create() {
    setBusy('create'); setError(null);
    try {
      const filter = parsedFilter();
      if (!label.trim()) throw new Error('Give this plan a label first.');
      await api.createCustomPlan({ track, label: label.trim(), brief: rationale || brief, filter, target: Number(target) || 10 });
      setBrief(''); setLabel(''); setFilterText(''); setRationale(''); setPreview(null); setOpen(false);
      onCreated();
    } catch (e) { setError(e.message); }
    finally { setBusy(null); }
  }

  if (!open) {
    return (
      <button className="btn btn-outline" style={{ marginBottom: '1.5rem' }} onClick={() => setOpen(true)}>
        + New custom plan for {track}
      </button>
    );
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1rem', margin: 0 }}>New custom plan — {track}</h2>
        <button className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.15rem .5rem' }} onClick={() => setOpen(false)}>close</button>
      </div>

      <label style={{ display: 'block', fontSize: '.8125rem', color: '#374151', margin: '.75rem 0 .25rem' }}>
        Context — geography, industry, who to include/exclude, anything you know that a filter alone can't capture
      </label>
      <textarea
        rows={3}
        style={{ width: '100%', fontSize: '.8125rem', padding: '.5rem', boxSizing: 'border-box' }}
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="e.g. Colombia, small manufacturers 25-100 employees, marketing/sales directors and general managers only -- not IT or production directors."
      />
      <button className="btn btn-primary" style={{ marginTop: '.5rem' }} disabled={busy || !brief.trim()} onClick={suggest}>
        {busy === 'suggest' ? 'Asking...' : filterText ? 'Suggest again (uses the filter below as a starting point)' : 'Suggest filters'}
      </button>

      {rationale && <p style={{ fontSize: '.8125rem', color: '#374151', marginTop: '.75rem' }}>{rationale}</p>}

      {filterText && (
        <>
          <div style={{ display: 'flex', gap: '.75rem', marginTop: '.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '.8125rem', color: '#374151', marginBottom: '.25rem' }}>Label</label>
              <input style={{ width: '100%', fontSize: '.8125rem', padding: '.4rem', boxSizing: 'border-box' }} value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div style={{ width: '6rem' }}>
              <label style={{ display: 'block', fontSize: '.8125rem', color: '#374151', marginBottom: '.25rem' }}>Target</label>
              <input type="number" style={{ width: '100%', fontSize: '.8125rem', padding: '.4rem', boxSizing: 'border-box' }} value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '.8125rem', color: '#374151', margin: '.75rem 0 .25rem' }}>
            Filter (edit directly, or tweak the context above and click Suggest again)
          </label>
          <textarea
            rows={10}
            style={{ width: '100%', fontSize: '.75rem', fontFamily: 'monospace', padding: '.5rem', boxSizing: 'border-box' }}
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem' }}>
            <button className="btn btn-outline" disabled={busy} onClick={runPreview}>
              {busy === 'preview' ? 'Checking...' : 'Preview volume (free, no credits)'}
            </button>
            <button className="btn btn-primary" disabled={busy} onClick={create}>
              {busy === 'create' ? 'Creating...' : 'Create plan (still requires Approve to spend credits)'}
            </button>
          </div>

          {preview && (
            <p style={{ fontSize: '.8125rem', color: '#374151', marginTop: '.5rem' }}>
              {preview.total_entries} total match{preview.total_entries === 1 ? '' : 'es'} in Apollo for this filter.
              {preview.sample?.length > 0 && ` First few: ${preview.sample.slice(0, 5).map((s) => `${s.name || '?'} (${s.company || '?'})`).join(', ')}.`}
            </p>
          )}
        </>
      )}

      {error && <p style={{ color: '#b91c1c', marginTop: '.5rem' }}>{error}</p>}
    </div>
  );
}

export default function Apollo() {
  const [track, setTrack] = useState('ic');
  const [autoSelected, setAutoSelected] = useState(false);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const { plans: p } = await api.weeklyPlans(track, { status: ACTIVE_STATUSES });
      setPlans(p);
    } catch (e) {
      setError(e.message);
    }
  }

  // On first load, jump to whichever track actually has active (not yet
  // decided) plans instead of silently sitting on 'ic' with an empty state
  // -- confusing when all the real activity is on 'b2b' (or vice versa) and
  // looks like the whole pipeline is broken rather than just the wrong tab.
  useEffect(() => {
    if (autoSelected) return;
    (async () => {
      try {
        const [{ plans: icPlans }, { plans: b2bPlans }] = await Promise.all([
          api.weeklyPlans('ic', { status: ACTIVE_STATUSES }),
          api.weeklyPlans('b2b', { status: ACTIVE_STATUSES }),
        ]);
        setAutoSelected(true);
        if (track === 'ic' && icPlans.length === 0 && b2bPlans.length > 0) {
          setTrack('b2b');
          setPlans(b2bPlans);
        } else {
          setPlans(track === 'ic' ? icPlans : b2bPlans);
        }
      } catch (e) {
        setAutoSelected(true);
        setError(e.message);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (autoSelected) load(); }, [track]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 style={{ fontSize: '1.375rem', marginBottom: '1rem' }}>Apollo — weekly &amp; custom plans</h1>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
        {TRACKS.map((t) => (
          <button key={t} className={track === t ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTrack(t)}>{t}</button>
        ))}
      </div>

      <NewPlanForm track={track} onCreated={load} />

      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {plans.length === 0 && <p>No plans currently need review for this track. The standard weekly plan proposes itself every Friday, or start a custom one above.</p>}

      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} onChange={load} />
      ))}

      <CompletedPlansTable key={track} track={track} />
    </div>
  );
}
