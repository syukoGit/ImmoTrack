import { describe, expect, it } from 'vitest';

import { unwrap } from '../../shared/testing';
import { CanonicalUrl } from '../value-objects/CanonicalUrl';
import { SourceReference } from '../value-objects/SourceReference';
import { findExactMatchLevel } from './DuplicateMatchPolicy';

const identity = (source: string, reference: string, url: string) => ({
  sourceReference: unwrap(SourceReference.create(source, reference)),
  url: unwrap(CanonicalUrl.create(url)),
});

describe('findExactMatchLevel', () => {
  it('matches on source reference first (level 1)', () => {
    expect(
      findExactMatchLevel(
        identity('leboncoin', 'abc', 'https://a.example/1'),
        identity('leboncoin', 'abc', 'https://a.example/2'),
      ),
    ).toBe('SAME_SOURCE_REFERENCE');
  });

  it('matches on canonical URL across references (level 2)', () => {
    expect(
      findExactMatchLevel(
        identity('agence-x', 'ref-1', 'https://agence.example/bien/1?utm_campaign=y'),
        identity('agence-x', 'ref-2', 'http://agence.example/bien/1/'),
      ),
    ).toBe('SAME_CANONICAL_URL');
  });

  it('returns null when no deterministic rule applies', () => {
    expect(
      findExactMatchLevel(
        identity('pap', 'abc', 'https://pap.example/1'),
        identity('seloger', 'abc', 'https://seloger.example/1'),
      ),
    ).toBeNull();
  });
});
