export interface RejectedListing {
  readonly index: number;
  readonly sourceReference: string;
  readonly violations: readonly { readonly code: string; readonly field?: string }[];
}

export interface IngestionSummary {
  readonly received: number;
  readonly accepted: number;
  readonly rejected: number;
  readonly sourceErrorsReported: number;
  readonly rejectedListings: readonly RejectedListing[];
}

export type IngestionRejectionCode = 'UNKNOWN_SOURCE' | 'IDEMPOTENCY_KEY_CONFLICT';

/**
 * - `accepted` : lot enregistré pour la première fois ;
 * - `duplicate` : même idempotencyKey et même contenu, le résultat initial est renvoyé ;
 * - `rejected` : refus métier du lot entier, aucune écriture.
 */
export type IngestAgentBatchResult =
  | {
      readonly status: 'accepted' | 'duplicate';
      readonly ingestionRequestId: string;
      readonly summary: IngestionSummary;
    }
  | {
      readonly status: 'rejected';
      readonly code: IngestionRejectionCode;
      readonly message: string;
    };
