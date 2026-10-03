import type { AgentAuthenticator } from '@immotrack/application';
import { InfrastructureError, IngestAgentBatch } from '@immotrack/application';
import {
  buildAgentIngestionPayload,
  InMemoryIngestionStore,
  LEBONCOIN_SOURCE,
  ManualClock,
  RecordingLogger,
  SequentialIdGenerator,
  StableJsonHasher,
} from '@immotrack/test-utils';
import { describe, expect, it } from 'vitest';

import { createAgentIngestionHandler } from './createAgentIngestionHandler';

const TOKEN = 'test-agent-token-with-enough-entropy-0001';

const fakeAuthenticator: AgentAuthenticator = {
  authenticate: (credential) =>
    Promise.resolve(credential === TOKEN ? { agentId: 'agent-token:fake' } : null),
};

const setup = (options: { maxBodyBytes?: number } = {}) => {
  const store = new InMemoryIngestionStore([LEBONCOIN_SOURCE]);
  const logger = new RecordingLogger();
  const handle = createAgentIngestionHandler({
    authenticator: fakeAuthenticator,
    ingestAgentBatch: new IngestAgentBatch({
      ingestionRequests: store,
      sources: store,
      transactions: store,
      clock: new ManualClock(),
      ids: new SequentialIdGenerator(),
      hasher: new StableJsonHasher(),
      logger,
    }),
    logger,
    maxBodyBytes: options.maxBodyBytes ?? 100_000,
  });
  return { store, logger, handle };
};

const post = (
  body: unknown,
  headers: Record<string, string> = {},
  serialize: (value: unknown) => string = JSON.stringify,
) =>
  new Request('http://localhost/api/v1/agent-ingestion', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${TOKEN}`,
      ...headers,
    },
    body: serialize(body),
  });

describe('POST /api/v1/agent-ingestion handler', () => {
  it('returns 202 with the ingestion summary for a new batch', async () => {
    const { handle } = setup();

    const response = await handle(
      post(buildAgentIngestionPayload(), { 'x-correlation-id': 'corr-0000-abcd' }),
    );

    expect(response.status).toBe(202);
    expect(response.headers.get('x-correlation-id')).toBe('corr-0000-abcd');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      status: 'accepted',
      ingestionRequestId: '00000000-0000-4000-8000-000000000001',
      correlationId: 'corr-0000-abcd',
      summary: {
        received: 1,
        accepted: 1,
        rejected: 0,
        sourceErrorsReported: 0,
        rejectedListings: [],
      },
    });
  });

  it('returns 200 and the original result when the batch is replayed', async () => {
    const { handle, store } = setup();
    await handle(post(buildAgentIngestionPayload()));

    const response = await handle(post(buildAgentIngestionPayload()));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: 'duplicate',
      ingestionRequestId: '00000000-0000-4000-8000-000000000001',
    });
    expect(store.requests).toHaveLength(1);
  });

  it('returns 409 when an idempotency key is reused with another payload', async () => {
    const { handle } = setup();
    await handle(post(buildAgentIngestionPayload()));

    const response = await handle(post(buildAgentIngestionPayload({ listings: [] })));

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'IDEMPOTENCY_KEY_CONFLICT' } });
  });

  it('returns 422 for an unknown source', async () => {
    const { handle } = setup();
    const response = await handle(
      post(buildAgentIngestionPayload({ source: { code: 'unknown-portal', status: 'SUCCESS' } })),
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: { code: 'UNKNOWN_SOURCE' } });
  });

  it.each([
    ['missing', { authorization: '' }],
    ['wrong scheme', { authorization: `Basic ${TOKEN}` }],
    ['invalid token', { authorization: 'Bearer wrong-token-wrong-token-wrong-token' }],
  ])('returns 401 without details when the credential is %s', async (_case, headers) => {
    const { handle, store, logger } = setup();

    const response = await handle(post(buildAgentIngestionPayload(), headers));

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe('Bearer');
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
        correlationId: expect.any(String) as unknown,
      },
    });
    expect(store.requests).toHaveLength(0);
    expect(JSON.stringify(logger.entries)).not.toContain(TOKEN);
  });

  it('returns 400 with field paths when the contract is violated', async () => {
    const { handle, store } = setup();
    const response = await handle(post({ ...buildAgentIngestionPayload(), runId: 'nope' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: 'VALIDATION_FAILED', details: [{ path: 'runId' }] },
    });
    expect(store.requests).toHaveLength(0);
  });

  it('returns 409 for an unsupported schema version', async () => {
    const { handle } = setup();
    const response = await handle(post({ ...buildAgentIngestionPayload(), schemaVersion: '2.0' }));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'UNSUPPORTED_SCHEMA_VERSION' } });
  });

  it('returns 400 for malformed JSON', async () => {
    const { handle } = setup();
    const response = await handle(post('{"schemaVersion":', {}, (value) => String(value)));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
  });

  it('returns 415 when the body is not declared as JSON', async () => {
    const { handle } = setup();
    const response = await handle(
      post(buildAgentIngestionPayload(), { 'content-type': 'text/plain' }),
    );
    expect(response.status).toBe(415);
  });

  it('returns 413 when the payload exceeds the configured limit', async () => {
    const { handle } = setup({ maxBodyBytes: 1_024 });
    const payload = buildAgentIngestionPayload();
    const listing = payload.listings[0];
    if (listing === undefined) throw new Error('fixture must contain a listing');
    const response = await handle(
      post({ ...payload, listings: [{ ...listing, title: 'x'.repeat(2_000) }] }),
    );
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ error: { code: 'PAYLOAD_TOO_LARGE' } });
  });

  it('returns 503 with a correlation id when the infrastructure fails', async () => {
    const { handle, store, logger } = setup();
    store.failNextTransactionWith = new InfrastructureError('connection refused', {
      cause: new Error('password authentication failed for user "postgres"'),
    });

    const response = await handle(post(buildAgentIngestionPayload()));

    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: { correlationId: string; message: string } };
    expect(body.error.message).not.toContain('password');
    expect(logger.entries.at(-1)).toMatchObject({
      level: 'error',
      context: { correlationId: body.error.correlationId, eventType: 'SERVICE_UNAVAILABLE' },
    });
  });

  it('ignores an unsafe correlation id provided by the caller', async () => {
    const { handle } = setup();
    const response = await handle(
      post(buildAgentIngestionPayload(), { 'x-correlation-id': 'bad id <script>' }),
    );
    expect(response.headers.get('x-correlation-id')).toMatch(/^[0-9a-f-]{36}$/);
  });
});
