import type { DomainViolation } from '../../shared/DomainViolation';
import { violation } from '../../shared/DomainViolation';
import type { Result } from '../../shared/Result';
import { err } from '../../shared/Result';
import type { Money } from '../../shared/value-objects/Money';
import { Percentage } from '../value-objects/Percentage';

/**
 * Version du moteur de calcul, persistée avec chaque évaluation pour rendre les résultats
 * reproductibles. Toute modification d'un calculateur impose d'incrémenter cette version.
 */
export const CALCULATOR_VERSION = '0.1.0';

export interface GrossYieldInput {
  readonly annualRent: Money;
  readonly acquisitionCost: Money;
}

/** Rendement brut = loyers annuels / coût d'acquisition de référence. Fonction pure. */
export const calculateGrossYield = (
  input: GrossYieldInput,
): Result<Percentage, DomainViolation> => {
  if (!input.acquisitionCost.isPositive()) {
    return err(
      violation('MONEY_NOT_POSITIVE', 'Acquisition cost must be positive.', 'acquisitionCost'),
    );
  }
  return Percentage.fromRatio(input.annualRent.cents / input.acquisitionCost.cents);
};
