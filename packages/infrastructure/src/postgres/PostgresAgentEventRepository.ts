import type { AgentEvent, AgentEventRepository } from '@immotrack/application';

import type { PgExecutor } from './PgExecutor';
import { query } from './PgExecutor';

export class PostgresAgentEventRepository implements AgentEventRepository {
  constructor(private readonly db: PgExecutor) {}

  async append(event: AgentEvent): Promise<void> {
    await query(
      this.db,
      `insert into agent_events (id, run_id, ingestion_request_id, level, event_type, message,
                                 metadata, correlation_id, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        event.id,
        event.runId,
        event.ingestionRequestId,
        event.level,
        event.eventType,
        event.message,
        JSON.stringify(event.metadata),
        event.correlationId,
        event.occurredAt,
      ],
    );
  }
}
