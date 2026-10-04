import type { ListingStatus } from '@immotrack/domain';

export interface ListingSummary {
  readonly id: string;
  readonly title: string | null;
  readonly city: string;
  readonly postalCode: string | null;
  readonly priceCents: number | null;
  readonly surfaceM2: number | null;
  readonly status: ListingStatus;
  readonly lastSeenAt: Date;
}

export interface ListingQueries {
  listRecent(limit: number): Promise<readonly ListingSummary[]>;
}
