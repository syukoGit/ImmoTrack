import { createHash } from 'node:crypto';

import type { ContentHasher } from '@immotrack/application';

/** SHA-256 d'une sérialisation JSON canonique (clés triées récursivement). */
export class Sha256ContentHasher implements ContentHasher {
  hash(value: unknown): string {
    return createHash('sha256').update(canonicalJson(value)).digest('hex');
  }
}

export const canonicalJson = (value: unknown): string => JSON.stringify(canonicalize(value));

const canonicalize = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
};
