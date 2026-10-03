import type { AgentAuthenticator, IngestAgentBatch, Logger } from '@immotrack/application';
import { parseAgentIngestionBatch } from '@immotrack/contracts';

import { resolveCorrelationId } from '../correlation';
import { mapErrorToResponse } from '../mapErrorToResponse';
import { readBodyWithLimit } from '../readBodyWithLimit';
import { errorResponse } from '../responses';
import { presentIngestionResult } from './presentIngestionResult';
import { toIngestAgentBatchCommand } from './toIngestAgentBatchCommand';

export interface AgentIngestionHandlerDependencies {
  readonly authenticator: AgentAuthenticator;
  readonly ingestAgentBatch: Pick<IngestAgentBatch, 'execute'>;
  readonly logger: Logger;
  readonly maxBodyBytes: number;
}

const BEARER = /^Bearer\s+(\S+)$/i;

/**
 * Adaptateur HTTP entrant de `POST /api/v1/agent-ingestion` :
 * authentification → limites → validation du contrat → use case → présentation.
 */
export const createAgentIngestionHandler =
  (deps: AgentIngestionHandlerDependencies) =>
  async (request: Request): Promise<Response> => {
    const correlationId = resolveCorrelationId(request.headers);
    const logger = deps.logger.child({ correlationId });
    try {
      const credential = BEARER.exec(request.headers.get('authorization') ?? '')?.[1] ?? null;
      const agent = await deps.authenticator.authenticate(credential);
      if (agent === null) {
        logger.warn('Agent authentication failed', { eventType: 'AGENT_AUTHENTICATION_FAILED' });
        return errorResponse(401, 'UNAUTHORIZED', 'Authentication required.', correlationId, {
          headers: { 'www-authenticate': 'Bearer' },
        });
      }

      const contentType = request.headers.get('content-type') ?? '';
      if (!/^application\/json\b/i.test(contentType)) {
        return errorResponse(
          415,
          'UNSUPPORTED_MEDIA_TYPE',
          'Content-Type must be application/json.',
          correlationId,
        );
      }

      const body = await readBodyWithLimit(request, deps.maxBodyBytes);
      if (!body.ok) {
        logger.warn('Ingestion payload too large', { eventType: 'INGESTION_PAYLOAD_TOO_LARGE' });
        return errorResponse(
          413,
          'PAYLOAD_TOO_LARGE',
          `Payload exceeds ${deps.maxBodyBytes} bytes. Split the batch.`,
          correlationId,
        );
      }

      let json: unknown;
      try {
        json = JSON.parse(body.text);
      } catch {
        logger.warn('Ingestion payload is not valid JSON', { eventType: 'INGESTION_INVALID_JSON' });
        return errorResponse(400, 'VALIDATION_FAILED', 'Body is not valid JSON.', correlationId);
      }

      const parsed = parseAgentIngestionBatch(json);
      if (!parsed.success) {
        logger.warn('Ingestion payload rejected by contract validation', {
          eventType: 'INGESTION_CONTRACT_VIOLATION',
          code: parsed.code,
          issues: parsed.details.length,
        });
        return errorResponse(
          parsed.code === 'UNSUPPORTED_SCHEMA_VERSION' ? 409 : 400,
          parsed.code,
          parsed.code === 'UNSUPPORTED_SCHEMA_VERSION'
            ? 'Unsupported schemaVersion.'
            : 'Payload does not match the agent ingestion contract.',
          correlationId,
          { details: parsed.details },
        );
      }

      const result = await deps.ingestAgentBatch.execute(
        toIngestAgentBatchCommand(parsed.data, agent, correlationId),
      );
      return presentIngestionResult(result, correlationId);
    } catch (error) {
      return mapErrorToResponse(error, correlationId, logger);
    }
  };
