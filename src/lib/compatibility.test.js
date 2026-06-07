import { describe, it, expect } from 'vitest';
import { calcCompatibility, datesOverlapDays } from './compatibility';

describe('datesOverlapDays', () => {
  it('returns 0 when a range is missing', () => {
    expect(datesOverlapDays(null, '2026-03-10', '2026-03-05', '2026-03-15')).toBe(0);
  });

  it('returns 0 for non-overlapping ranges', () => {
    expect(datesOverlapDays('2026-03-01', '2026-03-05', '2026-03-10', '2026-03-15')).toBe(0);
  });

  it('counts inclusive overlapping days', () => {
    // Mar 10–15 vs Mar 12–20 → Mar 12,13,14,15 = 4 days
    expect(datesOverlapDays('2026-03-10', '2026-03-15', '2026-03-12', '2026-03-20')).toBe(4);
  });

  it('handles identical single-day ranges', () => {
    expect(datesOverlapDays('2026-03-10', '2026-03-10', '2026-03-10', '2026-03-10')).toBe(1);
  });
});

describe('calcCompatibility', () => {
  it('gives the base score to total strangers', () => {
    expect(calcCompatibility({}, {})).toBe(30);
  });

  it('rewards same destination heavily', () => {
    const a = { destination: 'Bali' };
    const b = { destination: 'bali' }; // case/space-insensitive
    expect(calcCompatibility(a, b)).toBe(30 + 25);
  });

  it('adds a date-overlap bonus only at the same destination', () => {
    const sameDest = calcCompatibility(
      { destination: 'Bali', start_date: '2026-03-10', end_date: '2026-03-20' },
      { destination: 'Bali', start_date: '2026-03-15', end_date: '2026-03-25' },
    );
    const diffDest = calcCompatibility(
      { destination: 'Bali', start_date: '2026-03-10', end_date: '2026-03-20' },
      { destination: 'Tokyo', start_date: '2026-03-15', end_date: '2026-03-25' },
    );
    expect(sameDest).toBeGreaterThan(diffDest);
    expect(diffDest).toBe(30); // no destination match, no other signals
  });

  it('combines vibe, budget, interests and languages', () => {
    const a = { vibe: 'Adventurous', budget: 'Budget', interests: ['Hiking', 'Food'], languages: ['English', 'Spanish'] };
    const b = { vibe: 'Adventurous', budget: 'Budget', interests: ['Hiking', 'Food', 'Art'], languages: ['English'] };
    // base 30 + vibe 15 + budget 10 + 2 interests*6=12 + 1 lang*4=4 = 71
    expect(calcCompatibility(a, b)).toBe(71);
  });

  it('caps the score at 99', () => {
    const ideal = {
      destination: 'Bali', start_date: '2026-03-01', end_date: '2026-03-30',
      vibe: 'Adventurous', budget: 'Budget',
      interests: ['A', 'B', 'C', 'D', 'E'], languages: ['English', 'Spanish', 'French'],
    };
    expect(calcCompatibility(ideal, ideal)).toBe(99);
  });

  it('never returns negative', () => {
    expect(calcCompatibility({ interests: [] }, { interests: [] })).toBeGreaterThanOrEqual(0);
  });
});
