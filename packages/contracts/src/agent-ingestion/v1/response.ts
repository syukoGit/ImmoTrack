/** Réponse de `POST /api/v1/agent-ingestion` lorsque le lot est accepté ou rejoué. */
export interface AgentIngestionResponseV1 {
  readonly status: 'accepted' | 'duplicate';
  readonly ingestionRequestId: string;
  readonly correlationId: string;
  readonly summary: AgentIngestionSummaryV1;
}

export interface AgentIngestionSummaryV1 {
  readonly received: number;
  readonly accepted: number;
  readonly rejected: number;
  readonly sourceErrorsReported: number;
  readonly rejectedListings: readonly AgentRejectedListingV1[];
}

export interface AgentRejectedListingV1 {
  readonly index: number;
  readonly sourceReference: string;
  readonly violations: readonly { readonly code: string; readonly field?: string }[];
}
