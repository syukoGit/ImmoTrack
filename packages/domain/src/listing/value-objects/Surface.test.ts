import { describe, expect, it } from 'vitest';

import { unwrap, unwrapError } from '../../shared/testing';
import { Surface } from './Surface';

describe('Surface', () => {
  it('accepts positive surfaces rounded to the hundredth', () => {
    expect(unwrap(Surface.fromSquareMeters(41)).squareMeters).toBe(41);
    expect(unwrap(Surface.fromSquareMeters(41.456)).squareMeters).toBe(41.46);
  });

  it.each([0, -12, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid surface %s', (value) => {
    expect(unwrapError(Surface.fromSquareMeters(value)).code).toBe('SURFACE_INVALID');
  });

  it('rejects aberrant surfaces', () => {
    expect(unwrapError(Surface.fromSquareMeters(100_001)).code).toBe('SURFACE_OUT_OF_RANGE');
  });

  it('compares surfaces with a relative tolerance', () => {
    const a = unwrap(Surface.fromSquareMeters(40));
    const b = unwrap(Surface.fromSquareMeters(41));
    expect(a.isCloseTo(b, 3)).toBe(true);
    expect(a.isCloseTo(b, 2)).toBe(false);
    expect(a.equals(unwrap(Surface.fromSquareMeters(40)))).toBe(true);
    expect(Object.isFrozen(a)).toBe(true);
  });
});
