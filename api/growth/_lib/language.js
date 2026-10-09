// Shared between flowAssistant.js and prospectResearch.js -- email content
// language follows the PROSPECT's geography, never the track (b2b reaches
// both Colombia and US/Canada; even ic's US-focused positioning can pull a
// Colombia-based lead via Apollo). Jose: Colombian contacts get Latin
// American Spanish, US/Canada contacts get English.
const SPANISH_LATAM_COUNTRIES = [
  'colombia', 'mexico', 'méxico', 'argentina', 'chile', 'peru', 'perú', 'ecuador', 'venezuela',
  'bolivia', 'paraguay', 'uruguay', 'panama', 'panamá', 'costa rica', 'guatemala', 'honduras',
  'el salvador', 'nicaragua', 'dominican republic', 'república dominicana',
];

/** `locations` is any array of free-text location strings (a country name,
 *  "Colombia, Bogota", an Apollo organization_locations entry, etc.) --
 *  returns 'es' if any of them look like a Spanish-speaking LatAm country,
 *  'en' otherwise (the safe default). */
export function detectLanguage(locations) {
  const locs = (locations || []).filter(Boolean).map((s) => String(s).toLowerCase());
  const isLatam = locs.some((l) => SPANISH_LATAM_COUNTRIES.some((c) => l.includes(c)));
  return isLatam ? 'es' : 'en';
}

/** Language for a whole segment from its contacts' own countries: the
 *  majority wins, tie goes to Spanish only if strictly more are Spanish
 *  (ties -> English). Returns null with no usable countries so the caller
 *  can fall back to something else. Jose's rule (2026-10-06): Colombia,
 *  Mexico, Venezuela and the other Spanish-speaking LatAm countries ->
 *  Spanish; US, Canada, UK, UAE (his current target list) -> English. A
 *  manually-imported segment has no geography in its filter (just
 *  {manual:true}), which silently defaulted a Colombian flow to English --
 *  the contacts' countries are the ground truth. */
export function majorityLanguage(countries) {
  const known = (countries || []).filter(Boolean);
  if (!known.length) return null;
  const es = known.filter((c) => detectLanguage([c]) === 'es').length;
  return es > known.length - es ? 'es' : 'en';
}

/** Language one contact should be written to from their own country, or
 *  null when the country is blank/unknown (so callers don't treat "no data"
 *  as "English" and wrongly block someone). A contact's country is where
 *  the PERSON is per Apollo, which can differ from their company's (a
 *  Colombian company's US-based director is still an English-speaker). */
export function languageForCountry(country) {
  return country && String(country).trim() ? detectLanguage([country]) : null;
}
