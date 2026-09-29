// Minimal RFC-4180-ish CSV parser (quoted fields, embedded commas/
// newlines, "" escaped quotes) -- no library needed for what an Apollo
// contacts export actually looks like. Returns an array of rows, each row
// an array of raw string cells.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i += 1; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
      continue;
    }

    if (c === '"') { inQuotes = true; }
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((v) => v !== '')) rows.push(row); }
  return rows;
}

// Apollo's own export column names (people export) -- kept as aliases
// since exact headers can shift between Apollo UI versions. First match
// wins per field.
const FIELD_ALIASES = {
  email: ['email', 'email address'],
  first_name: ['first name', 'firstname'],
  last_name: ['last name', 'lastname'],
  title: ['title', 'job title'],
  company: ['company', 'company name', 'company name for emails', 'account name'],
  company_domain: ['company domain', 'website', 'domain', 'primary domain'],
  city: ['city', 'person city'],
  state: ['state', 'person state'],
  country: ['country', 'person country'],
  linkedin_url: ['linkedin url', 'person linkedin url', 'linkedin'],
};

function cleanDomain(v) {
  if (!v) return '';
  return v.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
}

/** Parses CSV text into {contacts, mappedFields, unmappedHeaders} -- rows
 *  without a usable email are dropped (email is the only hard requirement,
 *  same as the automated Apollo pull). */
export function parseApolloExport(text) {
  const rows = parseCSV(text);
  if (!rows.length) return { contacts: [], mappedFields: [], unmappedHeaders: [] };

  const [header, ...dataRows] = rows;
  const colIndex = {};
  header.forEach((h, i) => {
    const norm = h.trim().toLowerCase();
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (colIndex[field] === undefined && aliases.includes(norm)) colIndex[field] = i;
    }
  });

  const mappedFields = Object.keys(colIndex);
  const mappedIndexes = new Set(Object.values(colIndex));
  const unmappedHeaders = header.filter((_, i) => !mappedIndexes.has(i));

  const get = (r, field) => (colIndex[field] !== undefined ? (r[colIndex[field]] || '').trim() : '');
  const contacts = dataRows
    .map((r) => ({
      email: get(r, 'email').toLowerCase(),
      first_name: get(r, 'first_name'),
      last_name: get(r, 'last_name'),
      title: get(r, 'title'),
      company: get(r, 'company'),
      company_domain: cleanDomain(get(r, 'company_domain')),
      city: get(r, 'city'),
      state: get(r, 'state'),
      country: get(r, 'country'),
      linkedin_url: get(r, 'linkedin_url'),
    }))
    .filter((c) => c.email);

  return { contacts, mappedFields, unmappedHeaders };
}
