import { agentIngestionExampleV1 } from '@immotrack/contracts';
import type { Metadata } from 'next';

import { AgentIngestForm } from '@/components/agent-ingest/AgentIngestForm';

export const metadata: Metadata = { title: 'Ingestion agent' };
export const dynamic = 'force-dynamic';

export default function AgentIngestPage() {
  const example = {
    ...agentIngestionExampleV1,
    idempotencyKey: `manual:${new Date().toISOString()}`,
    runId: crypto.randomUUID(),
  };
  return (
    <>
      <h1>Ingestion agent (page technique)</h1>
      <p className="muted">
        Dépose un lot au format du contrat v1.0 sur <code>POST /api/v1/agent-ingestion</code> et
        affiche l&apos;accusé de réception. Page réservée à l&apos;administrateur authentifié.
      </p>
      <AgentIngestForm
        endpoint="/api/v1/agent-ingestion"
        examplePayload={JSON.stringify(example, null, 2)}
      />
    </>
  );
}
