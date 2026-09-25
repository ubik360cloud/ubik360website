import { supabase } from './supabase.js';

const API_URL = import.meta.env.VITE_API_URL || 'https://ubik360.com';

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const res = await fetch(`${API_URL}/api/growth${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export const api = {
  me: () => request('/me'),
  weeklyPlan: (track) => request(`/weekly-plan/current?track=${track}`),
  weeklyPlans: (track, { status, page, pageSize } = {}) => {
    const params = new URLSearchParams({ track });
    if (status) params.set('status', status);
    if (page) params.set('page', page);
    if (pageSize) params.set('page_size', pageSize);
    return request(`/weekly-plan/list?${params}`);
  },
  suggestFilter: (track, brief, priorFilter) =>
    request('/weekly-plan/suggest-filter', { method: 'POST', body: JSON.stringify({ track, brief, prior_filter: priorFilter }) }),
  previewFilter: (filter, limit) => request('/weekly-plan/preview', { method: 'POST', body: JSON.stringify({ filter, limit }) }),
  createCustomPlan: (payload) => request('/weekly-plan/custom', { method: 'POST', body: JSON.stringify(payload) }),
  updatePlan: (id, patch) => request(`/weekly-plan/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  suggestFlowForPlan: (planId) => request(`/weekly-plan/${planId}/suggest-flow`, { method: 'POST' }),
  weeklyPlanStaged: (id) => request(`/weekly-plan/${id}/staged`),
  approveWeeklyPlan: (id) => request(`/weekly-plan/${id}/approve`, { method: 'POST' }),
  stageApprove: (id, excludeIds = []) =>
    request(`/weekly-plan/${id}/stage-approve`, { method: 'POST', body: JSON.stringify({ exclude_ids: excludeIds }) }),

  oneoffs: (params = {}) => request(`/oneoffs?${new URLSearchParams(params)}`),
  updateOneoff: (id, patch) => request(`/oneoffs/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  sendOneoff: (id) => request(`/oneoffs/${id}/send`, { method: 'POST' }),

  leads: (params = {}) => request(`/leads?${new URLSearchParams(params)}`),
  lead: (id) => request(`/leads/${id}`),
  updateLead: (id, patch) => request(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  flows: (params = {}) => request(`/flows?${new URLSearchParams(params)}`),
  createFlow: (payload) => request('/flows', { method: 'POST', body: JSON.stringify(payload) }),
  enrollSegment: (flowId, planId) => request(`/flows/${flowId}/enroll-segment`, { method: 'POST', body: JSON.stringify({ plan_id: planId }) }),
  testSendFlowStep: (flowId, stepNo, to) => request(`/flows/${flowId}/test-send`, { method: 'POST', body: JSON.stringify({ step_no: stepNo, to }) }),
  flow: (id) => request(`/flows/${id}`),
  updateFlow: (id, patch) => request(`/flows/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  setFlowSteps: (id, steps) => request(`/flows/${id}/steps`, { method: 'PUT', body: JSON.stringify({ steps }) }),
  enrollInFlow: (id, contactIds) => request(`/flows/${id}/enroll`, { method: 'POST', body: JSON.stringify({ contact_ids: contactIds }) }),

  deliverability: () => request('/deliverability'),
};
