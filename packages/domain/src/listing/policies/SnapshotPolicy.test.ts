import { describe, expect, it } from 'vitest';

import { unwrap } from '../../shared/testing';
import type { ObservedListingInput } from '../entities/ObservedListing';
import { createObservedListing } from '../entities/ObservedListing';
import { listSignificantChanges } from './SnapshotPolicy';

const base: ObservedListingInput = {
  sourceCode: 'seloger',
  sourceReference: 'S-1',
  url: 'https://www.seloger.com/annonces/1.htm',
  title: 'Maison 4 pièces',
  priceEuros: 210_000,
  surfaceM2: 95,
  city: 'Joué-lès-Tours',
  postalCode: '37300',
  observedAt: new Date('2026-10-01T08:00:00Z'),
};

const observe = (overrides: Partial<ObservedListingInput> = {}) =>
  unwrap(createObservedListing({ ...base, ...overrides }));

describe('listSignificantChanges', () => {
  it('ignores a new observation without significant change', () => {
    expect(
      listSignificantChanges(observe(), observe({ observedAt: new Date('2026-10-02T08:00:00Z') })),
    ).toEqual([]);
  });

  it('detects a price drop', () => {
    expect(listSignificantChanges(observe(), observe({ priceEuros: 199_000 }))).toEqual(['price']);
  });

  it('detects nullable field changes', () => {
    expect(
      listSignificantChanges(observe(), observe({ surfaceM2: null, postalCode: null })),
    ).toEqual(['surface', 'postalCode']);
  });
});
