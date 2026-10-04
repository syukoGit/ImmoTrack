import type { DomainViolation } from './DomainViolation';
import { violation } from './DomainViolation';
import type { Result } from './Result';
import { err, ok } from './Result';

// eslint-disable-next-line no-control-regex -- on cherche précisément les caractères de contrôle.
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const WHITESPACE_RUNS = /\s+/g;

/** Normalise un texte libre : suppression des caractères de contrôle et des espaces superflus. */
export const normalizeText = (raw: string): string =>
  raw.replace(CONTROL_CHARACTERS, '').replace(WHITESPACE_RUNS, ' ').trim();

export const requireText = (
  raw: string,
  field: string,
  maxLength: number,
): Result<string, DomainViolation> => {
  const value = normalizeText(raw);
  if (value.length === 0) {
    return err(violation('TEXT_REQUIRED', `${field} is required.`, field));
  }
  if (value.length > maxLength) {
    return err(violation('TEXT_TOO_LONG', `${field} exceeds ${maxLength} characters.`, field));
  }
  return ok(value);
};
