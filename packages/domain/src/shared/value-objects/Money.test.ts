import { describe, expect, it } from 'vitest';

import { unwrap, unwrapError } from '../testing';
import { Money } from './Money';

describe('Money', () => {
  it('stores euros as integer cents', () => {
    const money = unwrap(Money.fromEuros(92_000.5));
    expect(money.cents).toBe(9_200_050);
    expect(money.euros).toBe(92_000.5);
    expect(money.currency).toBe('EUR');
  });

  it('handles binary floating point representations of two-decimal amounts', () => {
    expect(unwrap(Money.fromEuros(0.1 + 0.2)).cents).toBe(30);
    expect(unwrap(Money.fromEuros(1.005 * 100)).cents).toBe(10_050);
  });

  it('rejects amounts with more than two decimals instead of rounding silently', () => {
    expect(unwrapError(Money.fromEuros(10.001)).code).toBe('MONEY_TOO_PRECISE');
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])('rejects non finite amount %s', (amount) => {
    expect(unwrapError(Money.fromEuros(amount)).code).toBe('MONEY_NOT_FINITE');
  });

  it('rejects non integer cents and out of range amounts', () => {
    expect(unwrapError(Money.fromCents(10.5)).code).toBe('MONEY_NOT_FINITE');
    expect(unwrapError(Money.fromCents(100_000_000_001)).code).toBe('MONEY_OUT_OF_RANGE');
  });

  it('is immutable', () => {
    const money = unwrap(Money.fromCents(100));
    expect(Object.isFrozen(money)).toBe(true);
    expect(() => {
      (money as { cents: number }).cents = 1;
    }).toThrow(TypeError);
  });

  it('adds and subtracts without mutating operands', () => {
    const a = unwrap(Money.fromCents(1_000));
    const b = unwrap(Money.fromCents(2_500));
    expect(a.add(b).cents).toBe(3_500);
    expect(a.subtract(b).cents).toBe(-1_500);
    expect(a.subtract(b).isNegative()).toBe(true);
    expect(a.cents).toBe(1_000);
  });

  it('rounds multiplications half away from zero', () => {
    expect(unwrap(Money.fromCents(5)).multiply(0.5).cents).toBe(3);
    expect(unwrap(Money.fromCents(-5)).multiply(0.5).cents).toBe(-3);
    expect(unwrap(Money.fromCents(-1)).multiply(0.4).cents).toBe(0);
  });

  it('compares by value', () => {
    expect(unwrap(Money.fromEuros(12)).equals(unwrap(Money.fromCents(1_200)))).toBe(true);
    expect(unwrap(Money.fromEuros(12)).compareTo(unwrap(Money.fromEuros(13)))).toBe(-1);
    expect(Money.zero().isPositive()).toBe(false);
  });

  it('serializes to an explicit JSON shape', () => {
    expect(JSON.stringify(unwrap(Money.fromEuros(1)))).toBe('{"cents":100,"currency":"EUR"}');
  });
});
