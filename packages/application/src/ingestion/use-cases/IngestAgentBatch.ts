import { createObservedListing } from '@immotrack/domain';

import type { AgentEvent } from '../../search-runs/ports/AgentEventRepository';
import type { SourceRepository } from '../../search-runs/ports/SourceRepository';
import type { Clock } from '../../shared/ports/Clock';
import type { ContentHasher } from '../../shared/ports/ContentHasher';
import type { IdGenerator } from '../../shared/ports/IdGenerator';
import type { Logger } from '../../shared/ports/Logger';
import type { TransactionRunner } from '../../shared/ports/TransactionRunner';
import type { IngestAgentBatchCommand } from '../IngestAgentBatchCommand';
import type {
  IngestAgentBatchResult,
  IngestionSummary,
  RejectedListing,
} from '../IngestAgentBatchResult';
import type {
  IngestionRequestRecord,
  IngestionRequestRepository,
} from '../ports/IngestionRequestRepository';
import type { IngestionTransactionScope } from '../ports/IngestionTransactionScope';

/** Nombre maximal de rejets détaillés renvoyés à l'agent et stockés dans le résumé. */
const MAX_REJECTED_DETAILS = 50;

export interface IngestAgentBatchDependencies {
  readonly ingestionRequests: IngestionRequestRepository;
  readonly sources: SourceRepository;
  readonly transactions: TransactionRunner<IngestionTransactionScope>;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly hasher: ContentHasher;
  readonly logger: Logger;
}

/**
 * Thin vertical slice de l'ingestion agent : idempotence, validation métier des annonces et
 * journalisation du lot dans le run. Le rapprochement, les snapshots et les recalculs seront
 * branchés ici sans changer le contrat d'entrée ni le résultat.
 */
export class IngestAgentBatch {
  constructor(private readonly deps: IngestAgentBatchDependencies) {}

  async execute(command: IngestAgentBatchCommand): Promise<IngestAgentBatchResult> {
    const logger = this.deps.logger.child({
      correlationId: command.correlationId,
      runId: command.runId,
      sourceCode: command.sourceCode,
    });
    const payloadHash = this.deps.hasher.hash(hashableContent(command));

    const previous = await this.deps.ingestionRequests.findByIdempotencyKey(command.idempotencyKey);
    if (previous !== null) {
      return replay(previous, payloadHash, logger);
    }

    const source = await this.deps.sources.findByCode(command.sourceCode);
    if (!source?.active) {
      logger.warn('Ingestion batch rejected: unknown or inactive source', {
        eventType: 'INGESTION_BATCH_REJECTED',
        reason: 'UNKNOWN_SOURCE',
      });
      return {
        status: 'rejected',
        code: 'UNKNOWN_SOURCE',
        message: `Source "${command.sourceCode}" is unknown or inactive.`,
      };
    }

    const summary = summarize(command);
    const receivedAt = this.deps.clock.now();
    const record: IngestionRequestRecord = {
      id: this.deps.ids.generate(),
      idempotencyKey: command.idempotencyKey,
      payloadHash,
      status: 'ACCEPTED',
      runId: command.runId,
      sourceCode: source.code,
      agentId: command.agent.agentId,
      correlationId: command.correlationId,
      summary,
      receivedAt,
    };

    const inserted = await this.deps.transactions.runInTransaction(async (scope) => {
      await scope.searchRuns.ensureStarted({
        id: command.runId,
        startedAt: receivedAt,
        correlationId: command.correlationId,
      });
      if (!(await scope.ingestionRequests.insertIfAbsent(record))) {
        return false;
      }
      for (const event of this.buildRunEvents(command, record)) {
        await scope.agentEvents.append(event);
      }
      return true;
    });

    if (!inserted) {
      // Une requête concurrente portant la même clé a été enregistrée entre-temps.
      const concurrent = await this.deps.ingestionRequests.findByIdempotencyKey(
        command.idempotencyKey,
      );
      if (concurrent === null) {
        throw new Error('Idempotency key reserved concurrently but not readable.');
      }
      return replay(concurrent, payloadHash, logger);
    }

    logger.info('Ingestion batch accepted', {
      eventType: 'INGESTION_BATCH_ACCEPTED',
      ingestionRequestId: record.id,
      received: summary.received,
      accepted: summary.accepted,
      rejected: summary.rejected,
      sourceStatus: command.sourceStatus,
    });
    return { status: 'accepted', ingestionRequestId: record.id, summary };
  }

  private buildRunEvents(
    command: IngestAgentBatchCommand,
    record: IngestionRequestRecord,
  ): AgentEvent[] {
    const base = {
      runId: command.runId,
      ingestionRequestId: record.id,
      correlationId: command.correlationId,
      occurredAt: record.receivedAt,
    };
    const { summary } = record;
    const events: AgentEvent[] = [
      {
        ...base,
        id: this.deps.ids.generate(),
        level: command.sourceStatus === 'SUCCESS' ? 'info' : 'warn',
        eventType: 'INGESTION_BATCH_ACCEPTED',
        message: `Batch from ${command.sourceCode}: ${summary.accepted} accepted, ${summary.rejected} rejected.`,
        metadata: {
          sourceCode: command.sourceCode,
          sourceStatus: command.sourceStatus,
          idempotencyKey: command.idempotencyKey,
          agentId: command.agent.agentId,
          observedAt: command.observedAt.toISOString(),
          received: summary.received,
          accepted: summary.accepted,
          rejected: summary.rejected,
        },
      },
    ];
    if (summary.rejected > 0) {
      events.push({
        ...base,
        id: this.deps.ids.generate(),
        level: 'warn',
        eventType: 'LISTINGS_REJECTED',
        message: `${summary.rejected} listing(s) rejected by domain validation.`,
        metadata: { sourceCode: command.sourceCode, rejectedListings: summary.rejectedListings },
      });
    }
    for (const reported of command.errors) {
      events.push({
        ...base,
        id: this.deps.ids.generate(),
        level: command.sourceStatus === 'FAILED' ? 'error' : 'warn',
        eventType: 'SOURCE_ERROR_REPORTED',
        message: reported.message,
        metadata: { sourceCode: command.sourceCode, code: reported.code, url: reported.url },
      });
    }
    return events;
  }
}

const replay = (
  previous: IngestionRequestRecord,
  payloadHash: string,
  logger: Logger,
): IngestAgentBatchResult => {
  if (previous.payloadHash !== payloadHash) {
    logger.warn('Ingestion batch rejected: idempotency key reused with a different payload', {
      eventType: 'INGESTION_BATCH_REJECTED',
      reason: 'IDEMPOTENCY_KEY_CONFLICT',
      ingestionRequestId: previous.id,
    });
    return {
      status: 'rejected',
      code: 'IDEMPOTENCY_KEY_CONFLICT',
      message: 'This idempotency key was already used with a different payload.',
    };
  }
  logger.info('Ingestion batch replayed', {
    eventType: 'INGESTION_BATCH_DUPLICATE',
    ingestionRequestId: previous.id,
  });
  return { status: 'duplicate', ingestionRequestId: previous.id, summary: previous.summary };
};

const summarize = (command: IngestAgentBatchCommand): IngestionSummary => {
  const rejectedListings: RejectedListing[] = [];
  command.listings.forEach((listing, index) => {
    const result = createObservedListing({
      sourceCode: command.sourceCode,
      sourceReference: listing.sourceReference,
      url: listing.url,
      title: listing.title,
      priceEuros: listing.price,
      surfaceM2: listing.surfaceM2,
      city: listing.city,
      postalCode: listing.postalCode,
      observedAt: command.observedAt,
    });
    if (!result.ok) {
      rejectedListings.push({
        index,
        sourceReference: listing.sourceReference,
        violations: result.error.map(({ code, field }) =>
          field === undefined ? { code } : { code, field },
        ),
      });
    }
  });
  return {
    received: command.listings.length,
    accepted: command.listings.length - rejectedListings.length,
    rejected: rejectedListings.length,
    sourceErrorsReported: command.errors.length,
    rejectedListings: rejectedListings.slice(0, MAX_REJECTED_DETAILS),
  };
};

/** Contenu métier du lot : exclut l'identité de l'agent et la corrélation de la requête HTTP. */
const hashableContent = (command: IngestAgentBatchCommand) => ({
  idempotencyKey: command.idempotencyKey,
  runId: command.runId,
  sourceCode: command.sourceCode,
  sourceStatus: command.sourceStatus,
  observedAt: command.observedAt.toISOString(),
  listings: command.listings,
  errors: command.errors,
});
