import { InfrastructureError, IngestAgentBatch } from '@immotrack/application';
import {
  buildIngestAgentBatchCommand,
  LEBONCOIN_SOURCE,
  ManualClock,
  RecordingLogger,
} from '@immotrack/test-utils';
import { resetTransactionalTables } from '@immotrack/test-utils/postgres';
import type pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, inject, it } from 'vitest';

import { Sha256ContentHasher } from '../hashing/Sha256ContentHasher';
import { RandomUuidGenerator } from '../ids/RandomUuidGenerator';
import { createPostgresIngestionScope } from './createPostgresIngestionScope';
import { createPostgresPool } from './createPostgresPool';
import { PostgresIngestionRequestRepository } from './PostgresIngestionRequestRepository';
import { PostgresListingQueries } from './PostgresListingQueries';
import { PostgresSearchRunRepository } from './PostgresSearchRunRepository';
import { PostgresSourceRepository } from './PostgresSourceRepository';
import { PostgresTransactionRunner } from './PostgresTransactionRunner';

let pool: pg.Pool;

const createUseCase = () =>
  new IngestAgentBatch({
    ingestionRequests: new PostgresIngestionRequestRepository(pool),
    sources: new PostgresSourceRepository(pool),
    transactions: new PostgresTransactionRunner(pool, createPostgresIngestionScope),
    clock: new ManualClock(),
    ids: new RandomUuidGenerator(),
    hasher: new Sha256ContentHasher(),
    logger: new RecordingLogger(),
  });

beforeAll(() => {
  pool = createPostgresPool({ connectionString: inject('databaseUrl'), maxConnections: 5 });
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  await resetTransactionalTables(pool);
});

describe('PostgresSourceRepository', () => {
  it('reads sources provisioned by the seed', async () => {
    const source = await new PostgresSourceRepository(pool).findByCode('leboncoin');
    expect(source).toEqual(LEBONCOIN_SOURCE);
    expect(await new PostgresSourceRepository(pool).findByCode('unknown')).toBeNull();
  });
});

describe('PostgresIngestionRequestRepository', () => {
  it('reserves an idempotency key only once', async () => {
    await new PostgresSearchRunRepository(pool).ensureStarted({
      id: '0b9f6d0e-3c1a-4d8e-9a43-6f1d2c7b8a90',
      startedAt: new Date('2026-10-03T06:15:00Z'),
      correlationId: 'corr-1',
    });
    const repository = new PostgresIngestionRequestRepository(pool);
    const record = {
      id: 'b0a1c7d2-0000-4000-8000-000000000001',
      idempotencyKey: 'key-00000001',
      payloadHash: 'a'.repeat(64),
      status: 'ACCEPTED' as const,
      runId: '0b9f6d0e-3c1a-4d8e-9a43-6f1d2c7b8a90',
      sourceCode: 'leboncoin',
      agentId: 'agent-token:test',
      correlationId: 'corr-1',
      summary: {
        received: 1,
        accepted: 1,
        rejected: 0,
        sourceErrorsReported: 0,
        rejectedListings: [],
      },
      receivedAt: new Date('2026-10-03T06:15:00Z'),
    };

    expect(await repository.insertIfAbsent(record)).toBe(true);
    expect(
      await repository.insertIfAbsent({ ...record, id: 'b0a1c7d2-0000-4000-8000-000000000002' }),
    ).toBe(false);
    expect(await repository.findByIdempotencyKey('key-00000001')).toEqual(record);
  });

  it('wraps database failures into InfrastructureError', async () => {
    const repository = new PostgresIngestionRequestRepository(pool);
    await expect(
      repository.insertIfAbsent({
        id: 'not-a-uuid',
        idempotencyKey: 'key-00000002',
        payloadHash: 'a'.repeat(64),
        status: 'ACCEPTED',
        runId: '0b9f6d0e-3c1a-4d8e-9a43-6f1d2c7b8a90',
        sourceCode: 'leboncoin',
        agentId: 'agent',
        correlationId: 'corr',
        summary: {
          received: 0,
          accepted: 0,
          rejected: 0,
          sourceErrorsReported: 0,
          rejectedListings: [],
        },
        receivedAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(InfrastructureError);
  });
});

describe('IngestAgentBatch with PostgreSQL adapters', () => {
  it('persists the request, opens the run and records correlated events atomically', async () => {
    const result = await createUseCase().execute(
      buildIngestAgentBatchCommand({
        sourceStatus: 'PARTIAL_SUCCESS',
        errors: [{ code: 'TIMEOUT', message: 'Page 3 timed out.', url: null }],
      }),
    );
    expect(result.status).toBe('accepted');

    const { rows: events } = await pool.query<{ event_type: string; correlation_id: string }>(
      'select event_type, correlation_id from agent_events order by event_type',
    );
    expect(events).toEqual([
      { event_type: 'INGESTION_BATCH_ACCEPTED', correlation_id: 'corr-test-0001' },
      { event_type: 'SOURCE_ERROR_REPORTED', correlation_id: 'corr-test-0001' },
    ]);

    const runs = await new PostgresSearchRunRepository(pool).listRecent(10);
    expect(runs).toEqual([
      expect.objectContaining({
        id: '0b9f6d0e-3c1a-4d8e-9a43-6f1d2c7b8a90',
        status: 'RUNNING',
        eventCount: 2,
        warningCount: 2,
      }),
    ]);
  });

  it('returns the original result when the same batch is replayed', async () => {
    const useCase = createUseCase();
    const first = await useCase.execute(buildIngestAgentBatchCommand());
    const second = await useCase.execute(
      buildIngestAgentBatchCommand({ correlationId: 'corr-retry' }),
    );
    expect(second).toEqual({ ...first, status: 'duplicate' });
    const { rows } = await pool.query('select id from ingestion_requests');
    expect(rows).toHaveLength(1);
  });

  it('never writes twice when the same batch is submitted concurrently', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => createUseCase().execute(buildIngestAgentBatchCommand())),
    );
    expect(results.filter((result) => result.status === 'accepted')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'duplicate')).toHaveLength(4);
    const { rows } = await pool.query<{ count: number }>(
      "select count(*)::int as count from agent_events where event_type = 'INGESTION_BATCH_ACCEPTED'",
    );
    expect(rows[0]?.count).toBe(1);
  });

  it('rolls back every write of the batch when one of them fails', async () => {
    const failingUseCase = new IngestAgentBatch({
      ingestionRequests: new PostgresIngestionRequestRepository(pool),
      sources: new PostgresSourceRepository(pool),
      transactions: new PostgresTransactionRunner(pool, (db) => ({
        ...createPostgresIngestionScope(db),
        agentEvents: {
          append: () => Promise.reject(new InfrastructureError('simulated failure')),
        },
      })),
      clock: new ManualClock(),
      ids: new RandomUuidGenerator(),
      hasher: new Sha256ContentHasher(),
      logger: new RecordingLogger(),
    });

    await expect(failingUseCase.execute(buildIngestAgentBatchCommand())).rejects.toBeInstanceOf(
      InfrastructureError,
    );
    const { rows } = await pool.query(
      'select (select count(*) from ingestion_requests)::int as requests, ' +
        '(select count(*) from search_runs)::int as runs',
    );
    expect(rows[0]).toEqual({ requests: 0, runs: 0 });
  });
});

describe('PostgresListingQueries', () => {
  it('maps numeric columns to numbers', async () => {
    await pool.query(
      `insert into listings (id, canonical_hash, title, city, postal_code, surface_m2, price_cents,
                             first_seen_at, last_seen_at)
       values ('c0ffee00-0000-4000-8000-000000000001', 'hash', 'T2', 'Tours', '37000', 41.5,
               9200000, now(), now())`,
    );
    const [listing] = await new PostgresListingQueries(pool).listRecent(10);
    expect(listing).toMatchObject({
      title: 'T2',
      city: 'Tours',
      priceCents: 9_200_000,
      surfaceM2: 41.5,
      status: 'NEW',
    });
  });
});
