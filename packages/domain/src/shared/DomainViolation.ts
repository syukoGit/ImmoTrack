/**
 * Violation d'un invariant métier. Les value objects et politiques renvoient des violations
 * (via `Result`) plutôt que de lever des exceptions : un payload invalide est un cas attendu.
 */
export interface DomainViolation {
  readonly code: DomainViolationCode;
  readonly message: string;
  readonly field?: string;
}

export type DomainViolationCode =
  | 'MONEY_NOT_FINITE'
  | 'MONEY_TOO_PRECISE'
  | 'MONEY_OUT_OF_RANGE'
  | 'MONEY_NOT_POSITIVE'
  | 'PERCENTAGE_NOT_FINITE'
  | 'SURFACE_INVALID'
  | 'SURFACE_OUT_OF_RANGE'
  | 'SOURCE_CODE_INVALID'
  | 'SOURCE_REFERENCE_INVALID'
  | 'URL_INVALID'
  | 'URL_UNSUPPORTED_PROTOCOL'
  | 'URL_CONTAINS_CREDENTIALS'
  | 'URL_TOO_LONG'
  | 'POSTAL_CODE_INVALID'
  | 'TEXT_REQUIRED'
  | 'TEXT_TOO_LONG'
  | 'DATE_INVALID'
  | 'STATUS_TRANSITION_FORBIDDEN';

export const violation = (
  code: DomainViolationCode,
  message: string,
  field?: string,
): DomainViolation => (field === undefined ? { code, message } : { code, message, field });
