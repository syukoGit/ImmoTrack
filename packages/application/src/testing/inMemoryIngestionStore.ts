import type {
  IngestionRequestRecord,
  IngestionRequestRepository,
} from '../ingestion/ports/IngestionRequestRepository';
import type { IngestionTransactionScope } from '../ingestion/ports/IngestionTransactionScope';
import type { AgentEvent, AgentEventRepository } from '../search-runs/ports/AgentEventRepository';
import type {
  SearchRunQueries,
  SearchRunRepository,
  SearchRunSummary,
  StartSearchRun,
} from '../search-runs/ports/SearchRunRepository';
import type { SourceDescriptor, SourceRepository } from '../search-runs/ports/SourceRepository';
import type { TransactionRunner } from '../shared/ports/TransactionRunner';

interface State {
  readonly requests: Map<string, IngestionRequestRecord>;
  readonly runs: Map<string, StartSearchRun>;
  readonly events: AgentEvent[];
}

/**
 * Implémentation en mémoire des ports d'ingestion, avec une sémantique de transaction minimale
 * (état restauré si le travail échoue) pour tester les use cases sans base de données.
 */
export class InMemoryIngestionStore
  implements
    IngestionRequestRepository,
    SearchRunRepository,
    SearchRunQueries,
    AgentEventRepository,
    SourceRepository,
    TransactionRunner<IngestionTransactionScope>
{
  private state: State = { requests: new Map(), runs: new Map(), events: [] };
  readonly sources = new Map<string, SourceDescriptor>();
  /** Permet de simuler une panne d'infrastructure sur la prochaine transaction. */
  failNextTransactionWith: Error | null = null;

  constructor(sources: readonly SourceDescriptor[] = []) {
    for (const source of sources) {
      this.sources.set(source.code, source);
    }
  }

  get requests(): readonly IngestionRequestRecord[] {
    return [...this.state.requests.values()];
  }

  get runs(): readonly StartSearchRun[] {
    return [...this.state.runs.values()];
  }

  get events(): readonly AgentEvent[] {
    return [...this.state.events];
  }

  async runInTransaction<T>(work: (scope: IngestionTransactionScope) => Promise<T>): Promise<T> {
    const snapshot: State = {
      requests: new Map(this.state.requests),
      runs: new Map(this.state.runs),
      events: [...this.state.events],
    };
    try {
      if (this.failNextTransactionWith !== null) {
        const failure = this.failNextTransactionWith;
        this.failNextTransactionWith = null;
        throw failure;
      }
      return await work({ ingestionRequests: this, searchRuns: this, agentEvents: this });
    } catch (error) {
      this.state = snapshot;
      throw error;
    }
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<IngestionRequestRecord | null> {
    return Promise.resolve(this.state.requests.get(idempotencyKey) ?? null);
  }

  async insertIfAbsent(record: IngestionRequestRecord): Promise<boolean> {
    if (this.state.requests.has(record.idempotencyKey)) {
      return Promise.resolve(false);
    }
    this.state.requests.set(record.idempotencyKey, record);
    return Promise.resolve(true);
  }

  async ensureStarted(run: StartSearchRun): Promise<void> {
    if (!this.state.runs.has(run.id)) {
      this.state.runs.set(run.id, run);
    }
    return Promise.resolve();
  }

  async listRecent(limit: number): Promise<readonly SearchRunSummary[]> {
    const summaries = [...this.state.runs.values()]
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit)
      .map((run) => {
        const events = this.state.events.filter((event) => event.runId === run.id);
        return {
          id: run.id,
          status: 'RUNNING' as const,
          startedAt: run.startedAt,
          completedAt: null,
          eventCount: events.length,
          warningCount: events.filter((event) => event.level === 'warn' || event.level === 'error')
            .length,
        };
      });
    return Promise.resolve(summaries);
  }

  async append(event: AgentEvent): Promise<void> {
    this.state.events.push(event);
    return Promise.resolve();
  }

  async findByCode(code: string): Promise<SourceDescriptor | null> {
    return Promise.resolve(this.sources.get(code) ?? null);
  }
}
