import { Writable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { createPinoLogger } from './PinoLogger';

const capture = () => {
  const lines: Record<string, unknown>[] = [];
  const destination = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      lines.push(JSON.parse(chunk.toString()) as Record<string, unknown>);
      callback();
    },
  });
  return { lines, destination };
};

describe('createPinoLogger', () => {
  it('writes structured JSON with ingestion correlation fields', () => {
    const { lines, destination } = capture();
    const logger = createPinoLogger({ level: 'info', service: 'test', destination });

    logger
      .child({ correlationId: 'corr-1', runId: 'run-1', sourceCode: 'leboncoin' })
      .info('Ingestion batch accepted', { eventType: 'INGESTION_BATCH_ACCEPTED' });

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      level: 'info',
      service: 'test',
      message: 'Ingestion batch accepted',
      correlationId: 'corr-1',
      runId: 'run-1',
      sourceCode: 'leboncoin',
      eventType: 'INGESTION_BATCH_ACCEPTED',
    });
    expect(typeof lines[0]?.time).toBe('string');
  });

  it('redacts secrets at the top level and in nested objects', () => {
    const { lines, destination } = capture();
    const logger = createPinoLogger({ level: 'debug', service: 'test', destination });

    logger.warn('Auth failure', {
      token: 'secret-token-value',
      headers: { authorization: 'Bearer abc', cookie: 'sb=1' },
      request: { body: { password: 'hunter2' } },
    });

    const serialized = JSON.stringify(lines[0]);
    expect(serialized).not.toContain('secret-token-value');
    expect(serialized).not.toContain('Bearer abc');
    expect(serialized).not.toContain('hunter2');
    expect(serialized).toContain('[REDACTED]');
  });

  it('serializes errors with their stack for server-side diagnosis', () => {
    const { lines, destination } = capture();
    createPinoLogger({ level: 'info', service: 'test', destination }).error('Unexpected', {
      err: new Error('boom'),
    });
    expect(lines[0]?.err).toMatchObject({ type: 'Error', message: 'boom' });
  });

  it('honours the configured level', () => {
    const { lines, destination } = capture();
    createPinoLogger({ level: 'warn', service: 'test', destination }).info('ignored');
    expect(lines).toHaveLength(0);
  });
});
