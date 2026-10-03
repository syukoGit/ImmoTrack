import { describe, expect, it } from 'vitest';

import { unwrap, unwrapError } from '../../shared/testing';
import { Percentage } from './Percentage';

describe('Percentage', () => {
  it('is created from percentage points or from a ratio', () => {
    expect(unwrap(Percentage.fromPercent(5.5)).percent).toBe(5.5);
    expect(unwrap(Percentage.fromRatio(0.055)).percent).toBe(5.5);
    expect(unwrap(Percentage.fromPercent(5.5)).toRatio()).toBe(0.055);
  });

  it('rounds explicitly to four decimals', () => {
    expect(unwrap(Percentage.fromRatio(1 / 3)).percent).toBe(33.3333);
    expect(unwrap(Percentage.fromPercent(-0.00004)).percent).toBe(0);
  });

  it('rejects non finite values', () => {
    expect(unwrapError(Percentage.fromPercent(Number.NaN)).code).toBe('PERCENTAGE_NOT_FINITE');
  });

  it('supports range checks and value equality', () => {
    const rate = unwrap(Percentage.fromPercent(3.45));
    expect(rate.isWithin(0, 100)).toBe(true);
    expect(rate.isWithin(4, 100)).toBe(false);
    expect(rate.equals(unwrap(Percentage.fromRatio(0.0345)))).toBe(true);
    expect(Object.isFrozen(rate)).toBe(true);
  });
});
