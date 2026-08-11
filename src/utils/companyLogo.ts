// Company logo URLs via Unavatar (https://unavatar.io/{domain}) — no API key.
// Prefers the company's real domain when the directory has one; otherwise the
// domain is derived from the company name.

// Companies known to live on .de — derived domains for these try .de first.
const KNOWN_GERMAN = new Set([
  'personio', 'zalando', 'aboutyou', 'check24', 'sixt', 'trivago',
  'deutschebahn', 'douglas', 'ottogroup', 'rewe', 'lidl', 'aldi',
]);

// Legal-form suffixes that never appear in a domain.
const SUFFIX_RE = /\b(gmbh|inc|ltd|se|ag|corp|group|co|kg|kgaa|mbh|llc|plc|bv|nv|sa)\b/g;

function hostOf(domain: string): string {
  const s = (domain || '').trim();
  try { return new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`).hostname; }
  catch { return s.replace(/^https?:\/\//i, '').split('/')[0]; }
}

/** "CA Customer Alliance GmbH" → "cacustomeralliance" (suffixes + specials dropped). */
export function deriveCompanyDomain(name: string): string {
  const hadGermanSuffix = /\bgmbh\b/i.test(name);
  const base = name
    .toLowerCase()
    .replace(SUFFIX_RE, ' ')
    .replace(/[^a-z0-9]/g, '');
  if (!base) return '';
  const tld = hadGermanSuffix || KNOWN_GERMAN.has(base) ? 'de' : 'com';
  return `${base}.${tld}`;
}

/** Unavatar URL for a company — real domain when known, derived otherwise. */
export function companyLogoUrl(company: { companyName: string; domain?: string }): string | null {
  const domain = company.domain?.trim() ? hostOf(company.domain) : deriveCompanyDomain(company.companyName);
  return domain ? `https://unavatar.io/${domain}` : null;
}
