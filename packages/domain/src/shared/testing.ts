import type { Result } from './Result';

/** Aide de test : extrait la valeur d'un `Result` ou échoue explicitement. */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (!result.ok) {
    throw new Error(`Expected ok result, got error: ${JSON.stringify(result.error)}`);
  }
  return result.value;
};

export const unwrapError = <T, E>(result: Result<T, E>): E => {
  if (result.ok) {
    throw new Error('Expected error result, got ok.');
  }
  return result.error;
};
