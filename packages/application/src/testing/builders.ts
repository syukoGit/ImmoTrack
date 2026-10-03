import type { IngestAgentBatchCommand } from '../ingestion/IngestAgentBatchCommand';
import type { SourceDescriptor } from '../search-runs/ports/SourceRepository';

export const LEBONCOIN_SOURCE: SourceDescriptor = {
  id: '6f1c2b7e-0000-4000-8000-00000000000a',
  code: 'leboncoin',
  name: 'leboncoin',
  active: true,
};

/** Commande applicative valide, alignée sur l'exemple de référence du contrat v1. */
export const buildIngestAgentBatchCommand = (
  overrides: Partial<IngestAgentBatchCommand> = {},
): IngestAgentBatchCommand => ({
  idempotencyKey: '2026-10-03:leboncoin:batch-001',
  runId: '0b9f6d0e-3c1a-4d8e-9a43-6f1d2c7b8a90',
  sourceCode: 'leboncoin',
  sourceStatus: 'SUCCESS',
  observedAt: new Date('2026-10-03T04:12:00.000Z'),
  listings: [
    {
      sourceReference: 'abc123',
      url: 'https://www.leboncoin.fr/ad/ventes_immobilieres/abc123',
      title: 'Appartement T2 41 m² proche gare',
      price: 92_000,
      surfaceM2: 41,
      city: 'Tours',
      postalCode: '37000',
      rawFacts: { rooms: 2 },
    },
  ],
  errors: [],
  agent: { agentId: 'agent-token:test' },
  correlationId: 'corr-test-0001',
  ...overrides,
});
