import type { ListingQueries, ListingSummary } from '../ports/ListingQueries';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export class ListListingSummaries {
  constructor(private readonly listings: ListingQueries) {}

  execute(query: { readonly limit?: number } = {}): Promise<readonly ListingSummary[]> {
    const limit = Math.min(Math.max(Math.trunc(query.limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
    return this.listings.listRecent(limit);
  }
}
