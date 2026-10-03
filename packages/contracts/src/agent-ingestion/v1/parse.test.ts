import { describe, expect, it } from 'vitest';

import { agentIngestionExampleV1 } from './example';
import { parseAgentIngestionBatch } from './parse';
import { AGENT_INGESTION_LIMITS } from './schema';

const clone = (): Record<string, unknown> => ({ ...structuredClone(agentIngestionExampleV1) });

describe('parseAgentIngestionBatch (v1.0)', () => {
  it('accepts the reference example', () => {
    const result = parseAgentIngestionBatch(clone());
    expect(result.success).toBe(true);
  });

  it('accepts a batch without listings reporting a failed source', () => {
    const payload = {
      ...clone(),
      source: { code: 'pap', status: 'FAILED' },
      listings: [],
      errors: [{ code: 'CAPTCHA', message: 'Blocked by captcha.' }],
    };
    expect(parseAgentIngestionBatch(payload).success).toBe(true);
  });

  it('distinguishes an unsupported schema version', () => {
    const result = parseAgentIngestionBatch({ ...clone(), schemaVersion: '2.0' });
    expect(result).toMatchObject({ success: false, code: 'UNSUPPORTED_SCHEMA_VERSION' });
  });

  it('rejects unknown fields to detect contract drift', () => {
    const result = parseAgentIngestionBatch({ ...clone(), grossYield: 7.2 });
    expect(result).toMatchObject({ success: false, code: 'VALIDATION_FAILED' });
  });

  it('reports the path of each invalid field', () => {
    const payload = clone();
    payload.runId = 'not-a-uuid';
    payload.listings = [{ ...agentIngestionExampleV1.listings[0], url: 'javascript:alert(1)' }];
    const result = parseAgentIngestionBatch(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details.map((detail) => detail.path)).toEqual(['runId', 'listings.0.url']);
    }
  });

  it('requires an observation date with an explicit offset', () => {
    const result = parseAgentIngestionBatch({ ...clone(), observedAt: '2026-10-03T06:12:00' });
    expect(result.success).toBe(false);
  });

  it('bounds the number of listings per batch', () => {
    const listing = agentIngestionExampleV1.listings[0];
    const payload = {
      ...clone(),
      listings: Array.from({ length: AGENT_INGESTION_LIMITS.maxListings + 1 }, () => listing),
    };
    expect(parseAgentIngestionBatch(payload).success).toBe(false);
  });

  it.each([null, 'text', 42, []])('rejects non object payload %j', (payload) => {
    expect(parseAgentIngestionBatch(payload)).toMatchObject({
      success: false,
      code: 'VALIDATION_FAILED',
    });
  });
});
