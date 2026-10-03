import { describe, expect, it } from 'vitest';

import { unwrap, unwrapError } from '../../shared/testing';
import { Money } from '../../shared/value-objects/Money';
import { calculateGrossYield } from './yield';

const euros = (amount: number) => unwrap(Money.fromEuros(amount));

describe('calculateGrossYield', () => {
  it.each([
    // [loyer mensuel, coût d'acquisition, rendement brut attendu en %]
    [550, 100_000, 6.6],
    [480, 92_000, 6.2609],
    [0, 92_000, 0],
  ])('rent %d €/month for %d € gives %d %%', (monthlyRent, cost, expected) => {
    const result = calculateGrossYield({
      annualRent: euros(monthlyRent).multiply(12),
      acquisitionCost: euros(cost),
    });
    expect(unwrap(result).percent).toBe(expected);
  });

  it('rejects a non positive acquisition cost', () => {
    const error = unwrapError(
      calculateGrossYield({ annualRent: euros(6_000), acquisitionCost: Money.zero() }),
    );
    expect(error.code).toBe('MONEY_NOT_POSITIVE');
  });
});
