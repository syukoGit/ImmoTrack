import { describe, expect, it } from 'vitest';

import { unwrap, unwrapError } from '../../shared/testing';
import { PostalCode } from './PostalCode';

describe('PostalCode', () => {
  it('accepts French postal codes', () => {
    const code = unwrap(PostalCode.create('37 000'));
    expect(code.value).toBe('37000');
    expect(code.department).toBe('37');
    expect(code.equals(unwrap(PostalCode.create('37000')))).toBe(true);
  });

  it.each(['3700', '370000', '00100', '99000', 'ABCDE'])('rejects %s', (raw) => {
    expect(unwrapError(PostalCode.create(raw)).code).toBe('POSTAL_CODE_INVALID');
  });
});
