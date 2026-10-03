import { describe, expect, it } from 'vitest';

import { InMemoryIngestionStore } from '../../testing';
import type { SearchRunQueries } from '../ports/SearchRunRepository';
import { ListSearchRuns } from './ListSearchRuns';

const recordingQueries = () => {
  const limits: number[] = [];
  const queries: SearchRunQueries = {
    listRecent: (limit) => {
      limits.push(limit);
      return Promise.resolve([]);
    },
  };
  return { limits, queries };
};

describe('ListSearchRuns', () => {
  it.each([
    [undefined, 50],
    [10, 10],
    [0, 1],
    [10_000, 200],
    [12.7, 12],
  ])('bounds the requested limit %s to %s', async (requested, expected) => {
    const { limits, queries } = recordingQueries();
    await new ListSearchRuns(queries).execute(requested === undefined ? {} : { limit: requested });
    expect(limits).toEqual([expected]);
  });

  it('returns the most recent runs first', async () => {
    const store = new InMemoryIngestionStore();
    for (const [id, startedAt] of [
      ['run-old', '2026-10-01T00:00:00Z'],
      ['run-new', '2026-10-03T00:00:00Z'],
    ] as const) {
      await store.ensureStarted({ id, startedAt: new Date(startedAt), correlationId: 'corr-1' });
    }

    const runs = await new ListSearchRuns(store).execute();

    expect(runs.map((run) => run.id)).toEqual(['run-new', 'run-old']);
  });
});
