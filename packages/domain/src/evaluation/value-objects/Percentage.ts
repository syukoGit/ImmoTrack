import type { DomainViolation } from '../../shared/DomainViolation';
import { violation } from '../../shared/DomainViolation';
import type { Result } from '../../shared/Result';
import { err, ok } from '../../shared/Result';

/** Précision conservée : 4 décimales de pourcentage (soit 1/100 de point de base). */
const PRECISION = 10_000;

/**
 * Pourcentage immuable exprimé en points de pourcentage (5.5 = 5,5 %). La valeur est arrondie
 * explicitement à 4 décimales afin que deux calculs identiques produisent la même valeur stockée.
 */
export class Percentage {
  private constructor(readonly percent: number) {
    Object.freeze(this);
  }

  static fromPercent(percent: number): Result<Percentage, DomainViolation> {
    if (!Number.isFinite(percent)) {
      return err(violation('PERCENTAGE_NOT_FINITE', 'Percentage must be a finite number.'));
    }
    return ok(new Percentage(round(percent)));
  }

  static fromRatio(ratio: number): Result<Percentage, DomainViolation> {
    return Percentage.fromPercent(ratio * 100);
  }

  toRatio(): number {
    return this.percent / 100;
  }

  isWithin(minPercent: number, maxPercent: number): boolean {
    return this.percent >= minPercent && this.percent <= maxPercent;
  }

  equals(other: Percentage): boolean {
    return this.percent === other.percent;
  }

  toJSON(): number {
    return this.percent;
  }
}

const round = (value: number): number => {
  const rounded = (Math.sign(value) * Math.round(Math.abs(value) * PRECISION)) / PRECISION;
  return rounded === 0 ? 0 : rounded;
};
