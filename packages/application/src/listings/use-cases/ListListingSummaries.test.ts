import { describe, expect, it } from 'vitest';

import type { ListingQueries } from '../ports/ListingQueries';
import { ListListingSummaries } from './ListListingSummaries';

describe('ListListingSummaries', () => {
  it.each([
    [undefined, 100],
    [0, 1],
    [5_000, 500],
  ])('bounds the requested limit %s to %s', async (requested, expected) => {
    const limits: number[] = [];
    const queries: ListingQueries = {
      listRecent: (limit) => {
        limits.push(limit);
        return Promise.resolve([]);
      },
    };
    await new ListListingSummaries(queries).execute(
      requested === undefined ? {} : { limit: requested },
    );
    expect(limits).toEqual([expected]);
  });
});
