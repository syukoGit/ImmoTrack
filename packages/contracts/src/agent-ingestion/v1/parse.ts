import type { ApiErrorDetail } from '../../api/errors';
import type { AgentIngestionBatchV1 } from './schema';
import { AGENT_INGESTION_SCHEMA_VERSION, agentIngestionBatchV1Schema } from './schema';

export type ParseAgentIngestionResult =
  | { readonly success: true; readonly data: AgentIngestionBatchV1 }
  | {
      readonly success: false;
      readonly code: 'VALIDATION_FAILED' | 'UNSUPPORTED_SCHEMA_VERSION';
      readonly details: readonly ApiErrorDetail[];
    };

export const SUPPORTED_AGENT_INGESTION_SCHEMA_VERSIONS = [AGENT_INGESTION_SCHEMA_VERSION] as const;

/**
 * Valide un payload externe non typé. Une version de schéma inconnue est distinguée d'un
 * payload invalide afin que l'agent sache qu'il doit changer de contrat et non de données.
 */
export const parseAgentIngestionBatch = (payload: unknown): ParseAgentIngestionResult => {
  const version = readSchemaVersion(payload);
  if (version !== undefined && version !== AGENT_INGESTION_SCHEMA_VERSION) {
    return {
      success: false,
      code: 'UNSUPPORTED_SCHEMA_VERSION',
      details: [
        {
          path: 'schemaVersion',
          message: `Supported versions: ${SUPPORTED_AGENT_INGESTION_SCHEMA_VERSIONS.join(', ')}.`,
        },
      ],
    };
  }

  const result = agentIngestionBatchV1Schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    code: 'VALIDATION_FAILED',
    details: result.error.issues.slice(0, 50).map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  };
};

const readSchemaVersion = (payload: unknown): unknown =>
  typeof payload === 'object' && payload !== null && 'schemaVersion' in payload
    ? payload.schemaVersion
    : undefined;
