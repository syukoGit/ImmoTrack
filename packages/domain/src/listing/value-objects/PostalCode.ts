import type { DomainViolation } from '../../shared/DomainViolation';
import { violation } from '../../shared/DomainViolation';
import type { Result } from '../../shared/Result';
import { err, ok } from '../../shared/Result';

const FRENCH_POSTAL_CODE = /^(?!00)\d{5}$/;

/** Code postal français (5 chiffres, département 01 à 98). */
export class PostalCode {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Result<PostalCode, DomainViolation> {
    const value = raw.replace(/\s/g, '');
    if (!FRENCH_POSTAL_CODE.test(value) || value.startsWith('99')) {
      return err(
        violation('POSTAL_CODE_INVALID', 'Postal code must be a French postal code.', 'postalCode'),
      );
    }
    return ok(new PostalCode(value));
  }

  get department(): string {
    return this.value.slice(0, 2);
  }

  equals(other: PostalCode): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
