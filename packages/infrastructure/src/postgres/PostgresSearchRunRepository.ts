import type {
  SearchRunQueries,
  SearchRunRepository,
  SearchRunSummary,
  StartSearchRun,
} from '@immotrack/application';
import type { SearchRunStatus } from '@immotrack/domain';

import type { PgExecutor } from './PgExecutor';
import { query } from './PgExecutor';

interface SearchRunSummaryRow {
  id: string;
  status: SearchRunStatus;
  started_at: Date;
  completed_at: Date | null;
  event_count: number;
  warning_count: number;
}

export class PostgresSearchRunRepository implements SearchRunRepository, SearchRunQueries {
  constructor(private readonly db: PgExecutor) {}

  async ensureStarted(run: StartSearchRun): Promise<void> {
    await query(
      this.db,
      `insert into search_runs (id, started_at, status, correlation_id)
       values ($1, $2, 'RUNNING', $3)
       on conflict (id) do nothing`,
      [run.id, run.startedAt, run.correlationId],
    );
  }

  async listRecent(limit: number): Promise<readonly SearchRunSummary[]> {
    const { rows } = await query<SearchRunSummaryRow>(
      this.db,
      `select r.id, r.status, r.started_at, r.completed_at,
              count(e.id)::int as event_count,
              (count(e.id) filter (where e.level in ('warn', 'error')))::int as warning_count
         from search_runs r
         left join agent_events e on e.run_id = r.id
        group by r.id
        order by r.started_at desc
        limit $1`,
      [limit],
    );
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      eventCount: row.event_count,
      warningCount: row.warning_count,
    }));
  }
}
