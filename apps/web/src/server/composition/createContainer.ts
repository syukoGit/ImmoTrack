import type { Logger } from '@immotrack/application';
import { IngestAgentBatch, ListListingSummaries, ListSearchRuns } from '@immotrack/application';
import {
  createPostgresIngestionScope,
  createPostgresPool,
  PostgresIngestionRequestRepository,
  PostgresListingQueries,
  PostgresSearchRunRepository,
  PostgresSourceRepository,
  PostgresTransactionRunner,
  RandomUuidGenerator,
  Sha256AgentTokenAuthenticator,
  Sha256ContentHasher,
  SystemClock,
} from '@immotrack/infrastructure';

import type { ServerConfig } from '../config/serverConfig';
import { createAgentIngestionHandler } from '../http/agent-ingestion/createAgentIngestionHandler';

export interface Container {
  readonly useCases: {
    readonly ingestAgentBatch: IngestAgentBatch;
    readonly listSearchRuns: ListSearchRuns;
    readonly listListingSummaries: ListListingSummaries;
  };
  readonly http: {
    readonly agentIngestion: (request: Request) => Promise<Response>;
  };
  dispose(): Promise<void>;
}

/**
 * Composition root : seul endroit où les implémentations concrètes sont choisies et assemblées.
 * Aucune règle fonctionnelle ici.
 */
export const createContainer = (config: ServerConfig, logger: Logger): Container => {
  const pool = createPostgresPool({
    connectionString: config.databaseUrl,
    maxConnections: config.databasePoolMax,
    applicationName: 'immotrack-web',
  });

  const ingestAgentBatch = new IngestAgentBatch({
    ingestionRequests: new PostgresIngestionRequestRepository(pool),
    sources: new PostgresSourceRepository(pool),
    transactions: new PostgresTransactionRunner(pool, createPostgresIngestionScope),
    clock: new SystemClock(),
    ids: new RandomUuidGenerator(),
    hasher: new Sha256ContentHasher(),
    logger,
  });

  if (config.agentTokenHashes.length === 0) {
    logger.warn('No agent token configured: agent ingestion will reject every request', {
      eventType: 'AGENT_INGESTION_DISABLED',
    });
  }

  return {
    useCases: {
      ingestAgentBatch,
      listSearchRuns: new ListSearchRuns(new PostgresSearchRunRepository(pool)),
      listListingSummaries: new ListListingSummaries(new PostgresListingQueries(pool)),
    },
    http: {
      agentIngestion: createAgentIngestionHandler({
        authenticator: new Sha256AgentTokenAuthenticator(config.agentTokenHashes),
        ingestAgentBatch,
        logger,
        maxBodyBytes: config.agentIngestionMaxBodyBytes,
      }),
    },
    dispose: () => pool.end(),
  };
};
