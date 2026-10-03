import type { AgentEventRepository } from '../../search-runs/ports/AgentEventRepository';
import type { SearchRunRepository } from '../../search-runs/ports/SearchRunRepository';
import type { IngestionRequestRepository } from './IngestionRequestRepository';

/** Repositories partageant la même transaction lors de l'enregistrement d'un lot. */
export interface IngestionTransactionScope {
  readonly ingestionRequests: IngestionRequestRepository;
  readonly searchRuns: SearchRunRepository;
  readonly agentEvents: AgentEventRepository;
}
