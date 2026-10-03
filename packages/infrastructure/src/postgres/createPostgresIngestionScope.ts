import type { IngestionTransactionScope } from '@immotrack/application';

import type { PgExecutor } from './PgExecutor';
import { PostgresAgentEventRepository } from './PostgresAgentEventRepository';
import { PostgresIngestionRequestRepository } from './PostgresIngestionRequestRepository';
import { PostgresSearchRunRepository } from './PostgresSearchRunRepository';

export const createPostgresIngestionScope = (db: PgExecutor): IngestionTransactionScope => ({
  ingestionRequests: new PostgresIngestionRequestRepository(db),
  searchRuns: new PostgresSearchRunRepository(db),
  agentEvents: new PostgresAgentEventRepository(db),
});
