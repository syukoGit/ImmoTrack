import type { ContentHasher } from '../shared/ports/ContentHasher';

/** Empreinte lisible (JSON aux clés triées) : suffisante pour comparer deux contenus en test. */
export class StableJsonHasher implements ContentHasher {
  hash(value: unknown): string {
    return JSON.stringify(sortKeys(value));
  }
}

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortKeys(nested)]),
    );
  }
  return value;
};
