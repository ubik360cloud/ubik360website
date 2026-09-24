# Ubik 360 — B2B outreach positioning (track: b2b)

Canonical brief for the `grow@ubik360.com` cold-outreach track, pitching Ubik 360's own
services. Source of truth: `MARKETING.md` "Audience / ICP" — read that file for full context;
this is the condensed version for the research/drafting prompt.

## Who we're emailing

**U.S./Canada business owner, reaching inward — plus, as of 2026-09, Colombia-based
manufacturers reached directly (not just via the ES site's expansion-outward angle).**
Specifically: founders, SMEs, and decision-makers at growth-stage businesses — not limited to one
industry or company size beyond "growth-stage and actually deciding on marketing/staffing/ops
spend."

## What we sell (pick the ONE that fits this prospect, don't pitch all three)

1. **General growth marketing / fractional CMO** — for any NA business, no industry qualifier.
   Auto-dealership work is our strongest proof point (real outcomes), but the pitch itself stays
   industry-agnostic — lead broad, prove narrow. Never gate the pitch to "we only work with
   dealerships."
2. **Nearshore staffing** — reliable Colombia/LatAm staff (customer service, bookkeeping,
   back-office, appointment-setting) without full-time-hire overhead, for a business that's
   scaling and feeling the cost/availability pain of local hires.
3. **International expansion (into Colombia)** — for a U.S./Canada business wanting an actual
   operating presence in Colombia: market entry, an on-the-ground ops manager, local accounting.
   Narrower audience than the other two — only pitch this if there's a real signal (Spanish-market
   customers, LatAm hiring, expansion language on their site).
4. **Ecommerce growth + white-label subcontracting (Canada test, 2026-09)** — two angles under one
   pitch, pick whichever fits: (a) direct to a Canadian ecommerce/DTC brand, the same growth
   marketing service as #1 but leading with ecommerce-specific proof (multichannel scaling,
   Amazon/Walmart marketplace presence, conversion optimization); (b) to another marketing/ad
   agency as a **subcontractor/white-label partner** — Ubik 360 handles the technical/ecommerce
   execution work (the kind of build a generalist marketer at that agency can't do in-house) behind
   their client relationship, they keep the client. Only pitch (b) to an agency, never a direct
   brand — check whether the prospect's own business IS a marketing/ad agency before choosing this
   angle.
5. **Manufacturing production & logistics tooling (Colombia test, 2026-09)** — for a Colombia-based
   manufacturer: custom software/automation tooling for production planning and logistics
   coordination (not a generic "digital marketing" pitch — this is an ops/tooling pitch). Only use
   this angle for an actual manufacturing/production business, and only when the research surfaced
   a real, specific production or logistics pain point to reference — otherwise skip rather than
   force it.

## Target company size

**25–100 employees, across every geography (US, Canada, Colombia).** Small enough that Jose/Ubik
360 reaches an actual owner/decision-maker directly instead of a gatekeeper, big enough to
actually have marketing/ops spend to redirect. Added 2026-09-24 after the Colombia test pull's
Apollo results (Alquería, Audifarma) turned out to be large companies the job-title filter alone
didn't screen out — filtered at the Apollo search level (`organization_num_employees_ranges`) in
`_lib/weeklyPlan.js`, not just judged during research/drafting.

## Disqualifiers — skip, don't force a pitch

- Enterprise companies with existing full internal marketing/HR departments and no visible
  friction (skip growth-marketing and staffing pitches both) — should already be filtered out by
  company size above, but skip on sight if one slips through.
- Any business with no online presence to assess (can't verify fit — skip rather than guess).
- Businesses already publicly working with a competing agency/fractional CMO (say so in the
  verdict, still draft if there's a genuine differentiated angle, otherwise skip).

## Voice

First person, direct, no hype, no "excited to reach out." Reference something specific and real
about the prospect's business — never a generic template line. If nothing specific was found
in research, that itself is a reason to lower confidence or skip, not a reason to fall back to
generic copy.

## Output note

Follow the same JSON verdict shape the research function expects (see `prospectResearch.js`).
`business_unit` here should be one of `"growth_marketing" | "nearshore_staffing" |
"international_expansion" | "ecommerce_growth" | "agency_subcontracting" |
"manufacturing_ops_tooling" | "skip"`.
