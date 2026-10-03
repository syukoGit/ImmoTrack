import { describe, expect, it } from 'vitest';

import { unwrap, unwrapError } from '../../shared/testing';
import { CanonicalUrl } from './CanonicalUrl';

describe('CanonicalUrl', () => {
  it('produces a deterministic canonical form', () => {
    const url = unwrap(
      CanonicalUrl.create(
        ' HTTP://WWW.Example.COM:80/annonces/123/?utm_source=x&b=2&a=1&gclid=abc#photos ',
      ),
    );
    expect(url.value).toBe('https://www.example.com/annonces/123?a=1&b=2');
  });

  it('considers two variants of the same listing URL equal', () => {
    const a = unwrap(CanonicalUrl.create('https://example.com/annonce/42?xtor=AL-1'));
    const b = unwrap(CanonicalUrl.create('http://example.com/annonce/42/'));
    expect(a.equals(b)).toBe(true);
  });

  it('keeps the root path and non default ports', () => {
    expect(unwrap(CanonicalUrl.create('https://example.com/')).value).toBe('https://example.com/');
    expect(unwrap(CanonicalUrl.create('https://example.com:8443/a')).value).toBe(
      'https://example.com:8443/a',
    );
  });

  it.each([
    ['not a url', 'URL_INVALID'],
    ['ftp://example.com/file', 'URL_UNSUPPORTED_PROTOCOL'],
    ['javascript:alert(1)', 'URL_UNSUPPORTED_PROTOCOL'],
    ['https://user:secret@example.com/', 'URL_CONTAINS_CREDENTIALS'],
    [`https://example.com/${'a'.repeat(2048)}`, 'URL_TOO_LONG'],
  ])('rejects %s', (raw, code) => {
    expect(unwrapError(CanonicalUrl.create(raw)).code).toBe(code);
  });

  it('is immutable', () => {
    expect(Object.isFrozen(unwrap(CanonicalUrl.create('https://example.com/a')))).toBe(true);
  });
});
