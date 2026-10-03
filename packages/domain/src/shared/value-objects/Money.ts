import type { DomainViolation } from '../DomainViolation';
import { violation } from '../DomainViolation';
import type { Result } from '../Result';
import { err, ok } from '../Result';

export type Currency = 'EUR';

/** Plafond de sécurité (1 milliard d'euros) : au-delà, la valeur est considérée comme aberrante. */
const MAX_ABSOLUTE_CENTS = 100_000_000_000;
const FLOAT_TOLERANCE = 1e-6;

/**
 * Montant monétaire immuable stocké en centimes entiers pour éviter les erreurs d'arrondi
 * flottant. Les montants négatifs sont autorisés (ex. cash-flow) ; la positivité est une
 * règle du contexte appelant (`isPositive`).
 */
export class Money {
  private constructor(
    readonly cents: number,
    readonly currency: Currency,
  ) {
    Object.freeze(this);
  }

  static fromCents(cents: number, currency: Currency = 'EUR'): Result<Money, DomainViolation> {
    if (!Number.isSafeInteger(cents)) {
      return err(violation('MONEY_NOT_FINITE', 'Amount in cents must be a safe integer.'));
    }
    if (Math.abs(cents) > MAX_ABSOLUTE_CENTS) {
      return err(violation('MONEY_OUT_OF_RANGE', 'Amount is out of the supported range.'));
    }
    return ok(new Money(cents, currency));
  }

  /** Accepte au plus deux décimales : un montant plus précis est rejeté plutôt qu'arrondi. */
  static fromEuros(amount: number, currency: Currency = 'EUR'): Result<Money, DomainViolation> {
    if (!Number.isFinite(amount)) {
      return err(violation('MONEY_NOT_FINITE', 'Amount must be a finite number.'));
    }
    const scaled = amount * 100;
    const cents = Math.round(scaled);
    if (Math.abs(scaled - cents) > FLOAT_TOLERANCE) {
      return err(violation('MONEY_TOO_PRECISE', 'Amount must have at most two decimals.'));
    }
    return Money.fromCents(cents === 0 ? 0 : cents, currency);
  }

  static zero(currency: Currency = 'EUR'): Money {
    return new Money(0, currency);
  }

  get euros(): number {
    return this.cents / 100;
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  isNegative(): boolean {
    return this.cents < 0;
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents, this.currency);
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents, this.currency);
  }

  /** Multiplie puis arrondit au centime, demi-unité éloignée de zéro (règle explicite). */
  multiply(factor: number): Money {
    return new Money(roundHalfAwayFromZero(this.cents * factor), this.currency);
  }

  /** V1 mono-devise (EUR) : l'égalité porte sur le montant. */
  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  compareTo(other: Money): number {
    return Math.sign(this.cents - other.cents);
  }

  toJSON(): { cents: number; currency: Currency } {
    return { cents: this.cents, currency: this.currency };
  }
}

const roundHalfAwayFromZero = (value: number): number => {
  const rounded = Math.sign(value) * Math.round(Math.abs(value));
  return rounded === 0 ? 0 : rounded;
};
