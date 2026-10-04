import type { IngestAgentBatchResult } from '@immotrack/application';
import type { AgentIngestionResponseV1 } from '@immotrack/contracts';

import { errorResponse, jsonResponse } from '../responses';

const REJECTION_STATUS = {
  UNKNOWN_SOURCE: 422,
  IDEMPOTENCY_KEY_CONFLICT: 409,
} as const;

export const presentIngestionResult = (
  result: IngestAgentBatchResult,
  correlationId: string,
): Response => {
  if (result.status === 'rejected') {
    return errorResponse(REJECTION_STATUS[result.code], result.code, result.message, correlationId);
  }
  const body: AgentIngestionResponseV1 = {
    status: result.status,
    ingestionRequestId: result.ingestionRequestId,
    correlationId,
    summary: result.summary,
  };
  return jsonResponse(result.status === 'accepted' ? 202 : 200, body, correlationId);
};
