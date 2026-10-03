import { describe, expect, it } from 'vitest';

import { unwrap, unwrapError } from '../../shared/testing';
import { canTransitionListingStatus, transitionListingStatus } from './ListingStatusPolicy';

describe('ListingStatusPolicy', () => {
  it('allows the nominal qualification workflow', () => {
    expect(unwrap(transitionListingStatus('NEW', 'TO_ANALYZE'))).toBe('TO_ANALYZE');
    expect(canTransitionListingStatus('TO_ANALYZE', 'SHORTLISTED')).toBe(true);
    expect(canTransitionListingStatus('SHORTLISTED', 'CONTACTED')).toBe(true);
    expect(canTransitionListingStatus('ARCHIVED', 'TO_ANALYZE')).toBe(true);
  });

  it('forbids skipping the shortlist before contacting', () => {
    const error = unwrapError(transitionListingStatus('NEW', 'CONTACTED'));
    expect(error.code).toBe('STATUS_TRANSITION_FORBIDDEN');
    expect(error.field).toBe('status');
  });

  it('forbids no-op transitions', () => {
    expect(canTransitionListingStatus('REJECTED', 'REJECTED')).toBe(false);
  });
});
