import type { AgentEventLevel } from '@immotrack/domain';

export type AgentEventType =
  'INGESTION_BATCH_ACCEPTED' | 'SOURCE_ERROR_REPORTED' | 'LISTINGS_REJECTED';

/** Événement de run, append-only, corrélé à la requête d'origine. */
export interface AgentEvent {
  readonly id: string;
  readonly runId: string;
  readonly ingestionRequestId: string | null;
  readonly level: AgentEventLevel;
  readonly eventType: AgentEventType;
  readonly message: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly correlationId: string;
  readonly occurredAt: Date;
}

export interface AgentEventRepository {
  append(event: AgentEvent): Promise<void>;
}
