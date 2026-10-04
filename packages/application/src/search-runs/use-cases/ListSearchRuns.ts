import type { SearchRunQueries, SearchRunSummary } from '../ports/SearchRunRepository';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export interface ListSearchRunsQuery {
  readonly limit?: number;
}

export class ListSearchRuns {
  constructor(private readonly runs: SearchRunQueries) {}

  execute(query: ListSearchRunsQuery = {}): Promise<readonly SearchRunSummary[]> {
    const limit = Math.min(Math.max(Math.trunc(query.limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
    return this.runs.listRecent(limit);
  }
}
