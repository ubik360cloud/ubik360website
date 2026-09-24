import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

const TRACKS = ['ic', 'b2b'];

// Renders one plan card -- the standard weekly plan (no label) or a
// custom-labeled test campaign, both use the same propose -> approve (pulls
// from Apollo, spends credits) -> review staged -> stage-approve (imports)
// pipeline, just scoped per-plan instead of per-track so several can run
// side by side (see CLAUDE.md Growth Hub section).
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
  // A completed plan's full contact table is collapsed by default -- with
  // several completed plans stacked on the page, showing every one's table
  // open by default (as a prior version did) buried the one plan that
  // actually needs attention (status 'staged') under a wall of old rows.
  const [showStagedReadOnly, setShowStagedReadOnly] = useState(false);
  const [draftingFlow, setDraftingFlow] = useState(false);
  const navigate = useNavigate();

  // Drafts a flow for this segment: asks the AI for a name + steps grounded
  // in this plan's filter/brief, creates the flow linked to this plan
  // (source_plan_id, so "Enroll segment" on the Flows page knows who to
  // pull in), saves the suggested steps, then hands off to the Flows page
  // to review/edit -- nothing here activates or sends anything.
  async function draftFlow() {
    setDraftingFlow(true);
    setError(null);
    try {
      const suggestion = await api.suggestFlowForPlan(plan.id);
      const { flow } = await api.createFlow({
        track: plan.track,
        name: suggestion.name || `${plan.label || plan.track} flow`,
        description: suggestion.description,
        source_plan_id: plan.id,
      });
      if (suggestion.steps?.length) await api.setFlowSteps(flow.id, suggestion.steps);
      navigate(`/flows?open=${flow.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setDraftingFlow(false);
    }
  }

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
            {plan.counts?.imported != null && ` · ${plan.counts.imported} imported`}
            {plan.counts?.rejected != null && ` · ${plan.counts.rejected} rejected`}
          </p>
          {plan.status !== 'staged' && staged.length > 0 && !showStagedReadOnly && (
            <button className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.15rem .5rem', marginTop: '.25rem', marginLeft: '.5rem' }} onClick={() => setShowStagedReadOnly(true)}>
              review contacts
            </button>
          )}
          {plan.counts?.imported > 0 && (
            <button className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.15rem .5rem', marginTop: '.25rem', marginLeft: '.5rem' }} disabled={draftingFlow} onClick={draftFlow}>
              {draftingFlow ? 'Drafting...' : plan.flow_id ? 'Draft another flow for this segment' : 'Draft flow for this segment'}
            </button>
          )}
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

      {staged.length > 0 && (plan.status === 'staged' || showStagedReadOnly) && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid #f3f4f6', paddingTop: '.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <h2 style={{ fontSize: '1rem', margin: 0 }}>Staged candidates ({staged.length})</h2>
            {plan.status !== 'staged' && (
              <button className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.15rem .5rem' }} onClick={() => setShowStagedReadOnly(false)}>
                hide
              </button>
            )}
            {plan.status === 'staged' && (
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
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8125rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280' }}>
                <th>{plan.status === 'staged' ? 'Import?' : 'Status'}</th><th>Name</th><th>Title</th><th>Company</th><th>Email</th>
              </tr>
            </thead>
            <tbody>
              {staged.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid #f3f4f6', opacity: plan.status === 'staged' && !included.has(s.id) ? 0.4 : 1 }}>
                  <td>
                    {plan.status === 'staged' ? (
                      <input type="checkbox" checked={included.has(s.id)} onChange={() => toggleInclude(s.id)} title="Import this contact" />
                    ) : (
                      <span className="badge">{s.status}</span>
                    )}
                  </td>
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
      const { plans: p } = await api.weeklyPlans(track);
      setPlans(p);
    } catch (e) {
      setError(e.message);
    }
  }

  // On first load, jump to whichever track actually has plans instead of
  // silently sitting on 'ic' with an empty state -- confusing when all the
  // real activity is on 'b2b' (or vice versa) and looks like the whole
  // pipeline is broken rather than just showing the wrong tab.
  useEffect(() => {
    if (autoSelected) return;
    (async () => {
      try {
        const [{ plans: icPlans }, { plans: b2bPlans }] = await Promise.all([api.weeklyPlans('ic'), api.weeklyPlans('b2b')]);
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
      {plans.length === 0 && <p>No plans proposed yet for this track. The standard weekly plan proposes itself every Friday, or start a custom one above.</p>}

      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} onChange={load} />
      ))}
    </div>
  );
}
