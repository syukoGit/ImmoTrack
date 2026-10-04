import { describe, expect, it } from 'vitest';

import { Sha256ContentHasher } from './Sha256ContentHasher';

describe('Sha256ContentHasher', () => {
  const hasher = new Sha256ContentHasher();

  it('produces a 64 hex characters digest', () => {
    expect(hasher.hash({ a: 1 })).toMatch(/^[a-f0-9]{64}$/);
  });

  it('does not depend on key order', () => {
    expect(hasher.hash({ a: 1, b: { c: [1, 2], d: 'x' } })).toBe(
      hasher.hash({ b: { d: 'x', c: [1, 2] }, a: 1 }),
    );
  });

  it('is sensitive to values and array order', () => {
    expect(hasher.hash({ a: [1, 2] })).not.toBe(hasher.hash({ a: [2, 1] }));
    expect(hasher.hash({ at: new Date('2026-10-03T00:00:00Z') })).toBe(
      hasher.hash({ at: '2026-10-03T00:00:00.000Z' }),
    );
  });
});
