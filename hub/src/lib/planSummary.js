// One-line, auto-generated "how was this segment built" summary, so a segment
// is understandable even when its name/description were never filled in
// (2026-10-09, Jose: a completed segment sat there as just "ic weekly plan").
// Built purely from the plan's own stored filter -- nothing is invented.
export function describePlan(plan) {
  const f = plan.filter || {};
  if (f.manual) return 'Source: imported from an Apollo CSV export';

  const parts = ['Source: Apollo search'];
  const places = [...(f.person_locations || []), ...(f.organization_locations || [])];
  if (places.length) parts.push(places.join(', '));
  if (f.q_organization_keyword_tags?.length) parts.push(`industry: ${f.q_organization_keyword_tags.join(', ')}`);
  if (f.person_titles?.length) parts.push(`titles: ${f.person_titles.join(', ')}`);
  parts.push(f.organization_num_employees_ranges?.length
    ? `company size ${f.organization_num_employees_ranges.join(' / ').replace(/,/g, '–')}`
    : 'any company size');
  parts.push(`week of ${plan.week_of}`);
  return parts.join(' · ');
}

export function planName(plan) {
  return plan.label || `${plan.track} weekly plan (week of ${plan.week_of})`;
}
