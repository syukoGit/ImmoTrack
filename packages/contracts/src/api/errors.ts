/** Codes d'erreur stables exposés par l'API HTTP. Ne jamais renommer un code existant. */
export const API_ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNSUPPORTED_SCHEMA_VERSION',
  'UNSUPPORTED_MEDIA_TYPE',
  'PAYLOAD_TOO_LARGE',
  'UNAUTHORIZED',
  'UNKNOWN_SOURCE',
  'IDEMPOTENCY_KEY_CONFLICT',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorDetail {
  readonly path: string;
  readonly message: string;
}

/** Enveloppe d'erreur commune : message sûr + correlationId pour retrouver les logs serveur. */
export interface ApiErrorResponse {
  readonly error: {
    readonly code: ApiErrorCode;
    readonly message: string;
    readonly correlationId: string;
    readonly details?: readonly ApiErrorDetail[];
  };
}

export const CORRELATION_ID_HEADER = 'x-correlation-id';
