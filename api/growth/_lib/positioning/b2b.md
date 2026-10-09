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

## Angle selection — check these geography/industry gates FIRST

Before reasoning freely among the options below, apply these in order — don't default to the
generic growth-marketing pitch just because it's listed first:

1. If the prospect is **Colombia-based AND their industry is manufacturing/industrial/production**
   (metals, automotive, plastics, food processing, machinery, etc.) → use option 5
   (**manufacturing_ops_tooling**), not growth marketing. Growth marketing (option 1) is scoped to
   **NA businesses only** — a Colombian manufacturer should never get the generic marketing pitch.
2. If the prospect's own business IS a marketing/ad agency (industry says marketing/advertising)
   → use option 4(b) (**agency_subcontracting**), never a direct growth-marketing pitch to them.
3. Otherwise, pick among the remaining options by best industry/size fit.

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
   manufacturer: custom software/automation tooling to integrate legacy systems, automate
   processes, and analyze data across departments (production, logistics, sales, marketing) for
   data-driven decisions (not a generic "digital marketing" pitch — this is an ops/tooling pitch).
   The industry classification alone (manufacturing/industrial/automotive/etc.) is enough signal to
   use this angle for a Colombia-based company this size — no specific discovered pain point is
   needed or available, see "Angle selection" above.

## Target company size

**Default 25–100 employees** (US, Canada, Colombia) -- small enough that Jose/Ubik 360 reaches an
actual owner/decision-maker directly instead of a gatekeeper, big enough to actually have
marketing/ops spend to redirect. Added 2026-09-24 after the Colombia test pull's Apollo results
(Alquería, Audifarma) turned out to be large companies the job-title filter alone didn't screen out.
**It is a per-campaign setting, not a rule (2026-10-09, Jose):** every plan's filter carries its
own `organization_num_employees_ranges`, and a different industry can legitimately call for
smaller or larger companies (e.g. an auto-dealership group vs. a founder-led ecommerce shop) --
this default applies only when a campaign doesn't say otherwise. Enforced at the Apollo search
level in `_lib/weeklyPlan.js`, not just judged during drafting. Every plan also caps contacts
per company (`max_per_company`, default 2) so one large group can't absorb the pull.

## Disqualifiers — skip, don't force a pitch

- Enterprise companies with existing full internal marketing/HR departments and no visible
  friction (skip growth-marketing and staffing pitches both) — should already be filtered out by
  company size above, but skip on sight if one slips through.
- Any contact with no usable industry or company-size data at all (nothing to reason from — skip
  rather than guess at a fit).
- Businesses already publicly working with a competing agency/fractional CMO (say so in the
  verdict, still draft if there's a genuine differentiated angle, otherwise skip).

## Voice

First person, direct, no hype, no "excited to reach out." **Never open by telling the prospect
what they already know** ("I noticed that [company] does X") — reason instead from their industry
and size: a business of this size in this industry commonly faces the kind of problem the chosen
pitch solves. Be upfront that the actual specifics (their processes, systems, pain points) get
figured out together before proposing anything concrete — that honesty reads as competent, not
presumptuous. 2026-10-02: this replaced an earlier version that fetched and quoted the prospect's
own website — Jose flagged that "I noticed you do X" openings read as fake, since stating the
obvious back to someone who already knows their own business doesn't demonstrate real insight.

## Output note

Follow the same JSON verdict shape the research function expects (see `prospectResearch.js`).
`business_unit` here should be one of `"growth_marketing" | "nearshore_staffing" |
"international_expansion" | "ecommerce_growth" | "agency_subcontracting" |
"manufacturing_ops_tooling" | "skip"`.
