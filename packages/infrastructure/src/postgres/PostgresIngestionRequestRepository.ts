import type {
  IngestionRequestRecord,
  IngestionRequestRepository,
  IngestionSummary,
} from '@immotrack/application';

import type { PgExecutor } from './PgExecutor';
import { query } from './PgExecutor';

interface IngestionRequestRow {
  id: string;
  idempotency_key: string;
  payload_hash: string;
  run_id: string;
  source_code: string;
  agent_id: string;
  correlation_id: string;
  // Écrit exclusivement par `insertIfAbsent` à partir d'un `IngestionSummary`.
  response_summary: IngestionSummary;
  created_at: Date;
}

export class PostgresIngestionRequestRepository implements IngestionRequestRepository {
  constructor(private readonly db: PgExecutor) {}

  async findByIdempotencyKey(idempotencyKey: string): Promise<IngestionRequestRecord | null> {
    const { rows } = await query<IngestionRequestRow>(
      this.db,
      `select id, idempotency_key, payload_hash, run_id, source_code, agent_id, correlation_id,
              response_summary, created_at
         from ingestion_requests
        where idempotency_key = $1 and status = 'ACCEPTED'`,
      [idempotencyKey],
    );
    const row = rows[0];
    return row === undefined
      ? null
      : {
          id: row.id,
          idempotencyKey: row.idempotency_key,
          payloadHash: row.payload_hash,
          status: 'ACCEPTED',
          runId: row.run_id,
          sourceCode: row.source_code,
          agentId: row.agent_id,
          correlationId: row.correlation_id,
          summary: row.response_summary,
          receivedAt: row.created_at,
        };
  }

  async insertIfAbsent(record: IngestionRequestRecord): Promise<boolean> {
    // En cas d'insertion concurrente de la même clé, PostgreSQL attend la fin de l'autre
    // transaction avant de résoudre le conflit : aucune double écriture n'est possible.
    const { rowCount } = await query(
      this.db,
      `insert into ingestion_requests (id, idempotency_key, payload_hash, status, run_id,
                                       source_code, agent_id, correlation_id, response_summary,
                                       created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       on conflict (idempotency_key) do nothing`,
      [
        record.id,
        record.idempotencyKey,
        record.payloadHash,
        record.status,
        record.runId,
        record.sourceCode,
        record.agentId,
        record.correlationId,
        JSON.stringify(record.summary),
        record.receivedAt,
      ],
    );
    return rowCount === 1;
  }
}
