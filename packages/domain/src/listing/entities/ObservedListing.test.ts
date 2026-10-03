import { describe, expect, it } from 'vitest';

import { unwrap, unwrapError } from '../../shared/testing';
import type { ObservedListingInput } from './ObservedListing';
import { createObservedListing } from './ObservedListing';

const validInput: ObservedListingInput = {
  sourceCode: 'leboncoin',
  sourceReference: 'abc123',
  url: 'https://www.leboncoin.fr/ventes_immobilieres/abc123.htm?utm_medium=email',
  title: '  T2 lumineux   proche gare ',
  priceEuros: 92_000,
  surfaceM2: 41,
  city: 'Tours',
  postalCode: '37000',
  observedAt: new Date('2026-10-03T04:12:00Z'),
};

describe('createObservedListing', () => {
  it('normalizes a valid observation into value objects', () => {
    const listing = unwrap(createObservedListing(validInput));
    expect(listing.sourceReference.key).toBe('leboncoin:abc123');
    expect(listing.url.value).toBe('https://www.leboncoin.fr/ventes_immobilieres/abc123.htm');
    expect(listing.title).toBe('T2 lumineux proche gare');
    expect(listing.price.cents).toBe(9_200_000);
    expect(listing.surface?.squareMeters).toBe(41);
    expect(listing.postalCode?.value).toBe('37000');
    expect(Object.isFrozen(listing)).toBe(true);
  });

  it('accepts unknown surface and postal code', () => {
    const listing = unwrap(
      createObservedListing({ ...validInput, surfaceM2: null, postalCode: null }),
    );
    expect(listing.surface).toBeNull();
    expect(listing.postalCode).toBeNull();
  });

  it('reports every violation with the offending field', () => {
    const violations = unwrapError(
      createObservedListing({
        ...validInput,
        url: 'ftp://example.com',
        priceEuros: 0,
        surfaceM2: -3,
        title: ' ',
        observedAt: new Date(Number.NaN),
      }),
    );
    expect(violations.map((v) => [v.field, v.code])).toEqual([
      ['url', 'URL_UNSUPPORTED_PROTOCOL'],
      ['title', 'TEXT_REQUIRED'],
      ['price', 'MONEY_NOT_POSITIVE'],
      ['surfaceM2', 'SURFACE_INVALID'],
      ['observedAt', 'DATE_INVALID'],
    ]);
  });

  it('does not share the mutable input date', () => {
    const observedAt = new Date('2026-10-03T04:12:00Z');
    const listing = unwrap(createObservedListing({ ...validInput, observedAt }));
    observedAt.setFullYear(2000);
    expect(listing.observedAt.toISOString()).toBe('2026-10-03T04:12:00.000Z');
  });
});
