import { describe, expect, it } from 'vitest';

import { InfrastructureError } from '../../shared/errors';
import {
  buildIngestAgentBatchCommand,
  InMemoryIngestionStore,
  LEBONCOIN_SOURCE,
  ManualClock,
  RecordingLogger,
  SequentialIdGenerator,
  StableJsonHasher,
} from '../../testing';
import { IngestAgentBatch } from './IngestAgentBatch';

const setup = () => {
  const store = new InMemoryIngestionStore([
    LEBONCOIN_SOURCE,
    { id: 'source-pap', code: 'pap', name: 'PAP', active: false },
  ]);
  const logger = new RecordingLogger();
  const useCase = new IngestAgentBatch({
    ingestionRequests: store,
    sources: store,
    transactions: store,
    clock: new ManualClock('2026-10-03T06:15:00.000Z'),
    ids: new SequentialIdGenerator(),
    hasher: new StableJsonHasher(),
    logger,
  });
  return { store, logger, useCase };
};

describe('IngestAgentBatch', () => {
  describe('nominal case', () => {
    it('accepts a new batch and returns a typed summary', async () => {
      const { useCase } = setup();

      const result = await useCase.execute(buildIngestAgentBatchCommand());

      expect(result).toEqual({
        status: 'accepted',
        ingestionRequestId: '00000000-0000-4000-8000-000000000001',
        summary: {
          received: 1,
          accepted: 1,
          rejected: 0,
          sourceErrorsReported: 0,
          rejectedListings: [],
        },
      });
    });

    it('records the request, opens the run and appends a correlated event', async () => {
      const { store, useCase } = setup();

      await useCase.execute(buildIngestAgentBatchCommand());

      expect(store.requests).toHaveLength(1);
      expect(store.requests[0]).toMatchObject({
        idempotencyKey: '2026-10-03:leboncoin:batch-001',
        runId: '0b9f6d0e-3c1a-4d8e-9a43-6f1d2c7b8a90',
        agentId: 'agent-token:test',
        receivedAt: new Date('2026-10-03T06:15:00.000Z'),
      });
      expect(store.runs).toEqual([
        {
          id: '0b9f6d0e-3c1a-4d8e-9a43-6f1d2c7b8a90',
          startedAt: new Date('2026-10-03T06:15:00.000Z'),
          correlationId: 'corr-test-0001',
        },
      ]);
      expect(store.events).toEqual([
        expect.objectContaining({
          eventType: 'INGESTION_BATCH_ACCEPTED',
          level: 'info',
          correlationId: 'corr-test-0001',
          ingestionRequestId: store.requests[0]?.id,
        }),
      ]);
    });

    it('keeps valid listings when others fail domain validation', async () => {
      const { store, useCase } = setup();
      const valid = buildIngestAgentBatchCommand().listings[0];
      if (valid === undefined) throw new Error('fixture must contain a listing');

      const result = await useCase.execute(
        buildIngestAgentBatchCommand({
          listings: [
            valid,
            { ...valid, sourceReference: 'bad-1', postalCode: '99999', surfaceM2: -1 },
          ],
        }),
      );

      expect(result).toMatchObject({
        status: 'accepted',
        summary: {
          received: 2,
          accepted: 1,
          rejected: 1,
          rejectedListings: [
            {
              index: 1,
              sourceReference: 'bad-1',
              violations: [
                { code: 'SURFACE_INVALID', field: 'surfaceM2' },
                { code: 'POSTAL_CODE_INVALID', field: 'postalCode' },
              ],
            },
          ],
        },
      });
      expect(store.events.map((event) => event.eventType)).toEqual([
        'INGESTION_BATCH_ACCEPTED',
        'LISTINGS_REJECTED',
      ]);
    });

    it('records errors reported by a failed source without rejecting the batch', async () => {
      const { store, useCase } = setup();

      const result = await useCase.execute(
        buildIngestAgentBatchCommand({
          sourceStatus: 'FAILED',
          listings: [],
          errors: [{ code: 'CAPTCHA', message: 'Blocked by captcha.', url: null }],
        }),
      );

      expect(result).toMatchObject({ status: 'accepted', summary: { sourceErrorsReported: 1 } });
      expect(store.events.map((event) => [event.eventType, event.level])).toEqual([
        ['INGESTION_BATCH_ACCEPTED', 'warn'],
        ['SOURCE_ERROR_REPORTED', 'error'],
      ]);
    });

    it('logs the outcome with correlation fields', async () => {
      const { logger, useCase } = setup();

      await useCase.execute(buildIngestAgentBatchCommand());

      expect(logger.entries).toEqual([
        expect.objectContaining({
          level: 'info',
          context: expect.objectContaining({
            correlationId: 'corr-test-0001',
            runId: '0b9f6d0e-3c1a-4d8e-9a43-6f1d2c7b8a90',
            sourceCode: 'leboncoin',
            eventType: 'INGESTION_BATCH_ACCEPTED',
          }) as unknown,
        }),
      ]);
    });
  });

  describe('idempotency', () => {
    it('returns the original result for a replayed batch without writing again', async () => {
      const { store, useCase } = setup();
      const first = await useCase.execute(buildIngestAgentBatchCommand());

      const replay = await useCase.execute(
        buildIngestAgentBatchCommand({ correlationId: 'corr-retry', agent: { agentId: 'other' } }),
      );

      expect(replay).toEqual({ ...first, status: 'duplicate' });
      expect(store.requests).toHaveLength(1);
      expect(store.events).toHaveLength(1);
    });

    it('rejects a reused key carrying a different payload', async () => {
      const { store, useCase, logger } = setup();
      await useCase.execute(buildIngestAgentBatchCommand());

      const result = await useCase.execute(
        buildIngestAgentBatchCommand({ sourceStatus: 'FAILED' }),
      );

      expect(result).toEqual({
        status: 'rejected',
        code: 'IDEMPOTENCY_KEY_CONFLICT',
        message: 'This idempotency key was already used with a different payload.',
      });
      expect(store.requests).toHaveLength(1);
      expect(logger.entries.at(-1)).toMatchObject({
        level: 'warn',
        context: { eventType: 'INGESTION_BATCH_REJECTED', reason: 'IDEMPOTENCY_KEY_CONFLICT' },
      });
    });

    it('replays the winner when a concurrent request reserved the key first', async () => {
      const { store, useCase } = setup();
      const winner = await useCase.execute(buildIngestAgentBatchCommand());
      // Simule une course : la lecture initiale a lieu avant la validation du concurrent.
      const findCommitted = store.findByIdempotencyKey.bind(store);
      let reads = 0;
      store.findByIdempotencyKey = (key) => {
        reads += 1;
        return reads === 1 ? Promise.resolve(null) : findCommitted(key);
      };

      const result = await useCase.execute(
        buildIngestAgentBatchCommand({ correlationId: 'corr-late' }),
      );

      expect(result).toEqual({ ...winner, status: 'duplicate' });
      expect(store.requests).toHaveLength(1);
      expect(store.events).toHaveLength(1);
    });
  });

  describe('rejections', () => {
    it.each(['unknown-portal', 'pap'])(
      'rejects a batch from unknown or inactive source %s without any write',
      async (sourceCode) => {
        const { store, useCase } = setup();

        const result = await useCase.execute(buildIngestAgentBatchCommand({ sourceCode }));

        expect(result).toMatchObject({ status: 'rejected', code: 'UNKNOWN_SOURCE' });
        expect(store.requests).toHaveLength(0);
        expect(store.runs).toHaveLength(0);
        expect(store.events).toHaveLength(0);
      },
    );

    it('propagates infrastructure failures and leaves no partial write', async () => {
      const { store, useCase } = setup();
      store.failNextTransactionWith = new InfrastructureError('Database unavailable');

      await expect(useCase.execute(buildIngestAgentBatchCommand())).rejects.toBeInstanceOf(
        InfrastructureError,
      );
      expect(store.requests).toHaveLength(0);

      await expect(useCase.execute(buildIngestAgentBatchCommand())).resolves.toMatchObject({
        status: 'accepted',
      });
    });
  });
});
