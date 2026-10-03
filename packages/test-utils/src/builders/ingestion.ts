import type { AgentIngestionBatchV1 } from '@immotrack/contracts';
import { agentIngestionExampleV1 } from '@immotrack/contracts';

/** Payload HTTP v1 valide, à surcharger champ par champ. */
export const buildAgentIngestionPayload = (
  overrides: Partial<AgentIngestionBatchV1> = {},
): AgentIngestionBatchV1 => ({ ...structuredClone(agentIngestionExampleV1), ...overrides });
