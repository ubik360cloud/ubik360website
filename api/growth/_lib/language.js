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
