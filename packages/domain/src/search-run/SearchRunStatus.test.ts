import { describe, expect, it } from 'vitest';

import { deriveSearchRunStatus } from './SearchRunStatus';

describe('deriveSearchRunStatus', () => {
  it.each([
    [[], 'RUNNING'],
    [['SUCCESS', 'SUCCESS'], 'SUCCESS'],
    [['FAILED', 'FAILED'], 'FAILED'],
    [['SUCCESS', 'FAILED'], 'PARTIAL_SUCCESS'],
    [['PARTIAL_SUCCESS'], 'PARTIAL_SUCCESS'],
  ] as const)('aggregates %j into %s', (statuses, expected) => {
    expect(deriveSearchRunStatus(statuses)).toBe(expected);
  });
});
