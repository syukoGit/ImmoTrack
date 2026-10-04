import type { SourceRunStatus } from '@immotrack/domain';

import type { AgentIdentity } from '../identity/ports/AgentAuthenticator';

export interface AgentListingInput {
  readonly sourceReference: string;
  readonly url: string;
  readonly title: string;
  readonly price: number;
  readonly surfaceM2: number | null;
  readonly city: string;
  readonly postalCode: string | null;
  readonly rawFacts: Readonly<Record<string, unknown>>;
}

export interface AgentReportedError {
  readonly code: string;
  readonly message: string;
  readonly url: string | null;
}

/**
 * Commande construite par l'adaptateur entrant après validation du contrat. Elle ne contient
 * que des types primitifs : la normalisation métier est faite par le domaine.
 */
export interface IngestAgentBatchCommand {
  readonly idempotencyKey: string;
  readonly runId: string;
  readonly sourceCode: string;
  readonly sourceStatus: SourceRunStatus;
  readonly observedAt: Date;
  readonly listings: readonly AgentListingInput[];
  readonly errors: readonly AgentReportedError[];
  readonly agent: AgentIdentity;
  readonly correlationId: string;
}
