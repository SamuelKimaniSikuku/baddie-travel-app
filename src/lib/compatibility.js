// ═══════════════════════════════════════════════════════════════
// COMPATIBILITY SCORING — pure functions, no side effects
// Kept dependency-free so it can be unit tested in isolation.
// ═══════════════════════════════════════════════════════════════

// Number of overlapping days between two date ranges.
// Accepts ISO date strings (or anything Date can parse). Returns 0 when
// either range is missing or the ranges don't overlap.
export function datesOverlapDays(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return 0;
  const s1 = new Date(aStart).getTime();
  const e1 = new Date(aEnd).getTime();
  const s2 = new Date(bStart).getTime();
  const e2 = new Date(bEnd).getTime();
  if ([s1, e1, s2, e2].some(Number.isNaN)) return 0;

  const start = Math.max(s1, s2);
  const end = Math.min(e1, e2);
  if (end < start) return 0;
  return Math.round((end - start) / 86400000) + 1; // inclusive of both ends
}

function sharedCount(a = [], b = []) {
  return a.filter(x => b.includes(x)).length;
}

function sharedItems(a = [], b = []) {
  return a.filter(x => b.includes(x));
}

// Human-readable reasons two travelers are compatible, strongest first.
// Pure and dependency-free so it can be unit tested. Returns
// [{ icon, text }] — empty-ish profiles yield a single generic reason.
export function compatibilityReasons(me = {}, them = {}) {
  const reasons = [];

  const sameDest = me.destination && them.destination &&
    me.destination.trim().toLowerCase() === them.destination.trim().toLowerCase();
  if (sameDest) {
    reasons.push({ icon: '📍', text: `Both heading to ${them.destination}` });
    const overlap = datesOverlapDays(me.start_date, me.end_date, them.start_date, them.end_date);
    if (overlap > 0) {
      reasons.push({ icon: '📅', text: `Overlapping dates — ${overlap} day${overlap === 1 ? '' : 's'} together` });
    }
  }

  if (me.vibe && me.vibe === them.vibe) reasons.push({ icon: '✨', text: `Same vibe: ${them.vibe}` });
  if (me.budget && me.budget === them.budget) reasons.push({ icon: '💰', text: `Similar budget: ${them.budget}` });

  const interests = sharedItems(me.interests, them.interests);
  if (interests.length) reasons.push({ icon: '🎯', text: `Shared interests: ${interests.slice(0, 4).join(', ')}` });

  const langs = sharedItems(me.languages, them.languages);
  if (langs.length) reasons.push({ icon: '🗣️', text: `Both speak ${langs.slice(0, 3).join(', ')}` });

  if (!reasons.length) reasons.push({ icon: '🌍', text: 'A fresh new adventure buddy' });
  return reasons;
}

// Compatibility score (0–99) between two traveler profiles.
// Weighted for a *travel companion* app: going to the same place on
// overlapping dates matters most, then vibe/budget/interests.
export function calcCompatibility(me = {}, them = {}) {
  let score = 30; // base

  // Same destination is the strongest signal for traveling together.
  if (me.destination && them.destination &&
      me.destination.trim().toLowerCase() === them.destination.trim().toLowerCase()) {
    score += 25;

    // Bonus for overlapping travel dates (only meaningful at same place).
    const overlap = datesOverlapDays(me.start_date, me.end_date, them.start_date, them.end_date);
    if (overlap > 0) score += Math.min(15, 5 + overlap); // 6–15 by overlap length
  }

  if (me.vibe && me.vibe === them.vibe) score += 15;
  if (me.budget && me.budget === them.budget) score += 10;

  score += Math.min(18, sharedCount(me.interests, them.interests) * 6);
  score += Math.min(8, sharedCount(me.languages, them.languages) * 4);

  return Math.max(0, Math.min(score, 99));
}
