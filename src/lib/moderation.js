// ═══════════════════════════════════════════════════════════════
// MODERATION — display-name and signup-email checks.
// Pure functions, no side effects, unit tested in isolation.
// Client-side UX layer; migration 010 enforces the same rules in the
// database so API calls can't bypass them.
// ═══════════════════════════════════════════════════════════════

// Common leetspeak substitutions used to sneak slurs past filters.
const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '9': 'g', '@': 'a', '$': 's', '!': 'i', '+': 't' };

// Lowercase, map leetspeak, strip everything but letters, and collapse
// 3+ repeated letters down to 2 ("nigggger" -> "nigger", "aaa" -> "aa").
export function normalizeName(raw) {
  const mapped = String(raw || '')
    .toLowerCase()
    .split('')
    .map(ch => LEET[ch] || ch)
    .join('');
  const letters = mapped.replace(/[^a-z]/g, '');
  return letters.replace(/(.)\1{2,}/g, '$1$1');
}

// Tier 1: unambiguous as substrings — no legitimate name contains these.
const SUBSTRING_SLURS = [
  'nigger', 'nigga', 'faggot', 'wetback', 'beaner', 'porchmonkey',
  'towelhead', 'raghead', 'tranny', 'darkie',
];

// Tier 2: blocked only as a whole word/token, because they appear inside
// legitimate names ("Kikelomo", "Cooney", "Scunthorpe"...).
const EXACT_SLURS = [
  'kike', 'spic', 'coon', 'chink', 'gook', 'cunt', 'whore', 'slut',
  'hitler', 'nazi', 'fag', 'homo', 'retard',
];

// Returns an error message if the name is not allowed, else null.
export function nameIssue(raw) {
  const name = String(raw || '').trim();
  if (!name) return null; // emptiness is handled by required-field logic
  const norm = normalizeName(name);
  for (const s of SUBSTRING_SLURS) {
    if (norm.includes(s)) return 'That name isn’t allowed. Please choose another.';
  }
  // Token check: split the ORIGINAL on non-letters, normalize each token.
  const tokens = String(raw).toLowerCase().split(/[^a-z0-9@$!+]+/i).map(normalizeName);
  for (const t of tokens) {
    if (EXACT_SLURS.includes(t)) return 'That name isn’t allowed. Please choose another.';
  }
  return null;
}

// Disposable / burner email domains (subdomains match too).
export const DISPOSABLE_DOMAINS = [
  'stayhome.li', 'mailinator.com', 'guerrillamail.com', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamail.de', 'guerrillamail.info', 'sharklasers.com',
  'grr.la', '10minutemail.com', '10minutemail.net', 'tempmail.com', 'temp-mail.org',
  'tempmail.dev', 'throwawaymail.com', 'yopmail.com', 'yopmail.fr', 'getnada.com',
  'trashmail.com', 'maildrop.cc', 'dispostable.com', 'fakeinbox.com', 'mintemail.com',
  'mohmal.com', 'mailnesia.com', 'mytemp.email', 'burnermail.io', 'emailondeck.com',
  'moakt.com', 'tmpmail.net', 'tmpmail.org', 'disposablemail.com', '33mail.com',
  'mailsac.com', 'tempr.email', 'discard.email', 'mailcatch.com', 'harakirimail.com',
  'pokemail.net', 'spam4.me', '1secmail.com', '1secmail.net', '1secmail.org',
  'inboxkitten.com', 'mail7.io', 'emltmp.com',
];

// Returns an error message if the email uses a burner domain, else null.
export function emailIssue(raw) {
  const email = String(raw || '').trim().toLowerCase();
  const at = email.lastIndexOf('@');
  if (at === -1) return null; // format errors are handled elsewhere
  const domain = email.slice(at + 1);
  for (const d of DISPOSABLE_DOMAINS) {
    if (domain === d || domain.endsWith('.' + d)) {
      return 'Temporary email addresses aren’t allowed — please use a real inbox.';
    }
  }
  return null;
}
