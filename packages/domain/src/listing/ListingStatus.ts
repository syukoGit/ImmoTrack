export const LISTING_STATUSES = [
  'NEW',
  'TO_ANALYZE',
  'SHORTLISTED',
  'REJECTED',
  'CONTACTED',
  'ARCHIVED',
] as const;

/** Workflow manuel de qualification d'un bien. */
export type ListingStatus = (typeof LISTING_STATUSES)[number];
