// EN and ES are NOT 1:1 translations of each other (different audiences,
// different page sets -- see MARKETING.md "Audience / ICP"), so the language
// toggle can't just string-replace "/en/" <-> "/es/". This table maps only
// the pages that genuinely have a same-content counterpart; anything else
// (digital-marketing, nearshore-staffing, international-expansion on the EN
// side; expansion-internacional on the ES side -- pages with no real
// equivalent on the other side) falls back to that language's homepage
// rather than guessing at a misleading "closest" page.
const EN_TO_ES: Record<string, string> = {
  '/en/index.html': '/es/index.html',
  '/en/about.html': '/es/sobre-mi.html',
  '/en/contact.html': '/es/contacto.html',
  '/en/thank-you.html': '/es/gracias.html',
};

const ES_TO_EN: Record<string, string> = {
  '/es/index.html': '/en/index.html',
  '/es/sobre-mi.html': '/en/about.html',
  '/es/contacto.html': '/en/contact.html',
  '/es/gracias.html': '/en/thank-you.html',
};

export function getAlternatePath(currentPath: string, currentLang: 'en' | 'es'): string {
  // Layout passes bare "/en/" / "/es/" for the two homepages (not
  // "/en/index.html") -- normalize before lookup.
  const normalized = currentPath === '/en/' ? '/en/index.html'
    : currentPath === '/es/' ? '/es/index.html'
    : currentPath;

  if (currentLang === 'en') {
    return EN_TO_ES[normalized] ?? '/es/index.html';
  }
  return ES_TO_EN[normalized] ?? '/en/index.html';
}
