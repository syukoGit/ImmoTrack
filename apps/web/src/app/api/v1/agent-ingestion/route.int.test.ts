import { hashAgentToken } from '@immotrack/infrastructure';
import { buildAgentIngestionPayload } from '@immotrack/test-utils';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

const TOKEN = 'integration-agent-token-0123456789abcdef';

let POST: (request: Request) => Promise<Response>;
let db: pg.Pool;

const ingest = (body: unknown, token = TOKEN) =>
  POST(
    new Request('http://localhost/api/v1/agent-ingestion', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  );

beforeAll(async () => {
  // La route est chargée après la configuration de l'environnement lu par le composition root.
  process.env.DATABASE_URL = inject('databaseUrl');
  process.env.AGENT_INGESTION_TOKEN_SHA256 = hashAgentToken(TOKEN);
  process.env.LOG_LEVEL = 'error';
  ({ POST } = await import('./route'));
  db = new pg.Pool({ connectionString: inject('databaseUrl') });
});

afterAll(async () => {
  const { getContainer } = await import('@/server/composition/container');
  await getContainer().dispose();
  await db.end();
});

describe('POST /api/v1/agent-ingestion (PostgreSQL)', () => {
  it('accepts a valid batch, then replays it idempotently', async () => {
    const payload = buildAgentIngestionPayload({ idempotencyKey: 'it:route:batch-001' });

    const first = await ingest(payload);
    const second = await ingest(payload);

    expect(first.status).toBe(202);
    expect(second.status).toBe(200);
    const firstBody = (await first.json()) as { ingestionRequestId: string };
    expect(await second.json()).toMatchObject({
      status: 'duplicate',
      ingestionRequestId: firstBody.ingestionRequestId,
    });

    const { rows } = await db.query<{ requests: number; events: number; runs: number }>(
      `select (select count(*) from ingestion_requests where idempotency_key = 'it:route:batch-001')::int as requests,
              (select count(*) from agent_events where ingestion_request_id = $1)::int as events,
              (select count(*) from search_runs where id = $2)::int as runs`,
      [firstBody.ingestionRequestId, payload.runId],
    );
    expect(rows[0]).toEqual({ requests: 1, events: 1, runs: 1 });
  });

  it('rejects an invalid token before touching the database', async () => {
    const response = await ingest(
      buildAgentIngestionPayload({ idempotencyKey: 'it:route:unauthorized' }),
      'not-the-right-token-0123456789abcdefgh',
    );
    expect(response.status).toBe(401);
    const { rows } = await db.query(
      "select 1 from ingestion_requests where idempotency_key = 'it:route:unauthorized'",
    );
    expect(rows).toHaveLength(0);
  });
});
