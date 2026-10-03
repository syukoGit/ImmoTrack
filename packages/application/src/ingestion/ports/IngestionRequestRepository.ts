import type { IngestionSummary } from '../IngestAgentBatchResult';

export interface IngestionRequestRecord {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly payloadHash: string;
  readonly status: 'ACCEPTED';
  readonly runId: string;
  readonly sourceCode: string;
  readonly agentId: string;
  readonly correlationId: string;
  readonly summary: IngestionSummary;
  readonly receivedAt: Date;
}

export interface IngestionRequestRepository {
  findByIdempotencyKey(idempotencyKey: string): Promise<IngestionRequestRecord | null>;
  /**
   * Insère la requête sauf si la clé d'idempotence existe déjà. Renvoie `false` si une autre
   * requête concurrente a déjà réservé la clé : c'est la garantie anti-doublon de référence.
   */
  insertIfAbsent(record: IngestionRequestRecord): Promise<boolean>;
}
