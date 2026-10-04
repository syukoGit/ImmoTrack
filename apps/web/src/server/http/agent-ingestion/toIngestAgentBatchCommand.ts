import type { AgentIdentity, IngestAgentBatchCommand } from '@immotrack/application';
import type { AgentIngestionBatchV1 } from '@immotrack/contracts';

/** Mapping DTO v1 → commande applicative : aucune règle métier, uniquement de la forme. */
export const toIngestAgentBatchCommand = (
  payload: AgentIngestionBatchV1,
  agent: AgentIdentity,
  correlationId: string,
): IngestAgentBatchCommand => ({
  idempotencyKey: payload.idempotencyKey,
  runId: payload.runId,
  sourceCode: payload.source.code,
  sourceStatus: payload.source.status,
  observedAt: new Date(payload.observedAt),
  listings: payload.listings.map((listing) => ({
    sourceReference: listing.sourceReference,
    url: listing.url,
    title: listing.title,
    price: listing.price,
    surfaceM2: listing.surfaceM2 ?? null,
    city: listing.city,
    postalCode: listing.postalCode ?? null,
    rawFacts: listing.rawFacts ?? {},
  })),
  errors: payload.errors.map((error) => ({
    code: error.code,
    message: error.message,
    url: error.url ?? null,
  })),
  agent,
  correlationId,
});
