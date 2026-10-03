import type { Logger } from '@immotrack/application';
import { InfrastructureError } from '@immotrack/application';

import { ConfigurationError } from '../config/serverConfig';
import { errorResponse } from './responses';

/**
 * Traduit une erreur technique non gérée en réponse HTTP sûre : le client reçoit un code stable
 * et le correlationId ; la cause et la stack ne vont que dans les logs serveur.
 */
export const mapErrorToResponse = (
  error: unknown,
  correlationId: string,
  logger: Logger,
): Response => {
  if (error instanceof InfrastructureError || error instanceof ConfigurationError) {
    logger.error('Service unavailable', {
      correlationId,
      eventType: 'SERVICE_UNAVAILABLE',
      err: error,
    });
    return errorResponse(
      503,
      'SERVICE_UNAVAILABLE',
      'The service is temporarily unavailable. Retry later with the same idempotency key.',
      correlationId,
      { headers: { 'retry-after': '30' } },
    );
  }
  logger.error('Unexpected error', { correlationId, eventType: 'UNEXPECTED_ERROR', err: error });
  return errorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred.', correlationId);
};
