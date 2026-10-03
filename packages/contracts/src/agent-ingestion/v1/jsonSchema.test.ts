import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { renderAgentIngestionExample, renderAgentIngestionJsonSchema } from './jsonSchema';
import { parseAgentIngestionBatch } from './parse';

const readDoc = (path: string): string =>
  readFileSync(new URL(`../../../../../docs/api/${path}`, import.meta.url), 'utf8');

describe('published API documentation (run `pnpm contracts:generate` to update)', () => {
  it('JSON Schema is in sync with the Zod contract', () => {
    expect(readDoc('agent-ingestion.v1.schema.json')).toBe(renderAgentIngestionJsonSchema());
  });

  it('example payload is in sync and valid', () => {
    const example = readDoc('examples/agent-ingestion.v1.json');
    expect(example).toBe(renderAgentIngestionExample());
    expect(parseAgentIngestionBatch(JSON.parse(example)).success).toBe(true);
  });
});
