import { describe, it, expect } from 'vitest';
import { nameIssue, emailIssue, normalizeName } from './moderation';

describe('normalizeName', () => {
  it('maps leetspeak and strips symbols', () => {
    expect(normalizeName('N1gg3r')).toBe('nigger');
    expect(normalizeName('f-a-g-g-o-t')).toBe('faggot');
  });
  it('collapses 3+ repeats to 2 but keeps doubles', () => {
    expect(normalizeName('nigggger')).toBe('nigger');
    expect(normalizeName('aabb')).toBe('aabb');
  });
});

describe('nameIssue', () => {
  it('blocks hard slurs and evasions', () => {
    expect(nameIssue('nigger')).toBeTruthy();
    expect(nameIssue('N1GG3R')).toBeTruthy();
    expect(nameIssue('xXniggerXx')).toBeTruthy();
    expect(nameIssue('fa990t')).toBeTruthy();
  });
  it('blocks exact-tier words as whole tokens only', () => {
    expect(nameIssue('kike')).toBeTruthy();
    expect(nameIssue('Adolf Hitler')).toBeTruthy();
    // ...but not legitimate names that contain them
    expect(nameIssue('Kikelomo')).toBeNull();
    expect(nameIssue('Cooney')).toBeNull();
    expect(nameIssue('Scunthorpe')).toBeNull();
  });
  it('allows normal names', () => {
    expect(nameIssue('Samuel')).toBeNull();
    expect(nameIssue('Amara')).toBeNull();
    expect(nameIssue('Niger')).toBeNull(); // the country / river
    expect(nameIssue('')).toBeNull();
  });
});

describe('emailIssue', () => {
  it('blocks disposable domains and their subdomains', () => {
    expect(emailIssue('earpig127@stayhome.li')).toBeTruthy();
    expect(emailIssue('x@mailinator.com')).toBeTruthy();
    expect(emailIssue('x@foo.mailinator.com')).toBeTruthy();
  });
  it('allows real providers', () => {
    expect(emailIssue('someone@gmail.com')).toBeNull();
    expect(emailIssue('a@baddie.app')).toBeNull();
    expect(emailIssue('not-an-email')).toBeNull();
  });
});
