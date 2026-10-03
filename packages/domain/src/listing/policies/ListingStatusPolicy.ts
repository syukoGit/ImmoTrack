import type { DomainViolation } from '../../shared/DomainViolation';
import { violation } from '../../shared/DomainViolation';
import type { Result } from '../../shared/Result';
import { err, ok } from '../../shared/Result';
import type { ListingStatus } from '../ListingStatus';

const ALLOWED_TRANSITIONS: Readonly<Record<ListingStatus, readonly ListingStatus[]>> = {
  NEW: ['TO_ANALYZE', 'SHORTLISTED', 'REJECTED', 'ARCHIVED'],
  TO_ANALYZE: ['SHORTLISTED', 'REJECTED', 'ARCHIVED'],
  SHORTLISTED: ['TO_ANALYZE', 'CONTACTED', 'REJECTED', 'ARCHIVED'],
  CONTACTED: ['SHORTLISTED', 'REJECTED', 'ARCHIVED'],
  REJECTED: ['TO_ANALYZE', 'ARCHIVED'],
  ARCHIVED: ['TO_ANALYZE'],
};

export const canTransitionListingStatus = (from: ListingStatus, to: ListingStatus): boolean =>
  ALLOWED_TRANSITIONS[from].includes(to);

export const transitionListingStatus = (
  from: ListingStatus,
  to: ListingStatus,
): Result<ListingStatus, DomainViolation> =>
  canTransitionListingStatus(from, to)
    ? ok(to)
    : err(
        violation(
          'STATUS_TRANSITION_FORBIDDEN',
          `Transition from ${from} to ${to} is not allowed.`,
          'status',
        ),
      );
