import type { DomainViolation } from '../../shared/DomainViolation';
import { violation } from '../../shared/DomainViolation';
import type { Result } from '../../shared/Result';
import { err, ok } from '../../shared/Result';
import { normalizeText } from '../../shared/text';

const SOURCE_CODE_PATTERN = /^[a-z0-9][a-z0-9_-]{1,49}$/;
const MAX_REFERENCE_LENGTH = 200;

/**
 * Identifiant d'une annonce chez sa source (ex. `leboncoin` + `abc123`).
 * Niveau 1 de déduplication : même source et même référence = même annonce.
 */
export class SourceReference {
  private constructor(
    readonly sourceCode: string,
    readonly reference: string,
  ) {
    Object.freeze(this);
  }

  static create(sourceCode: string, reference: string): Result<SourceReference, DomainViolation> {
    const code = sourceCode.trim().toLowerCase();
    if (!SOURCE_CODE_PATTERN.test(code)) {
      return err(
        violation('SOURCE_CODE_INVALID', 'Source code must be a lowercase slug.', 'source.code'),
      );
    }
    const normalizedReference = normalizeText(reference);
    if (normalizedReference.length === 0 || normalizedReference.length > MAX_REFERENCE_LENGTH) {
      return err(
        violation(
          'SOURCE_REFERENCE_INVALID',
          `Source reference must contain 1 to ${MAX_REFERENCE_LENGTH} characters.`,
          'sourceReference',
        ),
      );
    }
    return ok(new SourceReference(code, normalizedReference));
  }

  get key(): string {
    return `${this.sourceCode}:${this.reference}`;
  }

  equals(other: SourceReference): boolean {
    return this.key === other.key;
  }

  toString(): string {
    return this.key;
  }
}
