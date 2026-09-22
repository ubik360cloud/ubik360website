# Ubik 360 — B2B outreach positioning (track: b2b)

Canonical brief for the `grow@ubik360.com` cold-outreach track, pitching Ubik 360's own
services. Source of truth: `MARKETING.md` "Audience / ICP" — read that file for full context;
this is the condensed version for the research/drafting prompt.

## Who we're emailing

**U.S./Canada business owner, reaching inward.** Specifically: founders, SMEs, and
decision-makers at growth-stage North American businesses — not limited to one industry or
company size beyond "growth-stage and actually deciding on marketing/staffing spend."

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

## Disqualifiers — skip, don't force a pitch

- Enterprise companies with existing full internal marketing/HR departments and no visible
  friction (skip growth-marketing and staffing pitches both).
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
"international_expansion" | "skip"`.
