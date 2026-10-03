import { describe, expect, it } from 'vitest';

import { unwrap, unwrapError } from '../../shared/testing';
import { SourceReference } from './SourceReference';

describe('SourceReference', () => {
  it('normalizes the source code and the reference', () => {
    const reference = unwrap(SourceReference.create(' LeBonCoin ', '  abc   123 '));
    expect(reference.sourceCode).toBe('leboncoin');
    expect(reference.reference).toBe('abc 123');
    expect(reference.key).toBe('leboncoin:abc 123');
  });

  it('rejects invalid source codes', () => {
    expect(unwrapError(SourceReference.create('le bon coin', 'abc')).code).toBe(
      'SOURCE_CODE_INVALID',
    );
    expect(unwrapError(SourceReference.create('x', 'abc')).code).toBe('SOURCE_CODE_INVALID');
  });

  it('rejects empty or oversized references', () => {
    expect(unwrapError(SourceReference.create('seloger', ' \u0000 ')).code).toBe(
      'SOURCE_REFERENCE_INVALID',
    );
    expect(unwrapError(SourceReference.create('seloger', 'a'.repeat(201))).code).toBe(
      'SOURCE_REFERENCE_INVALID',
    );
  });

  it('is equal when source and reference match', () => {
    const a = unwrap(SourceReference.create('pap', 'R-1'));
    expect(a.equals(unwrap(SourceReference.create('PAP', 'R-1')))).toBe(true);
    expect(a.equals(unwrap(SourceReference.create('pap', 'R-2')))).toBe(false);
    expect(Object.isFrozen(a)).toBe(true);
  });
});
