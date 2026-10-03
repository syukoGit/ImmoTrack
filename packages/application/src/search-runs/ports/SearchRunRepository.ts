import type { SearchRunStatus } from '@immotrack/domain';

export interface StartSearchRun {
  readonly id: string;
  readonly startedAt: Date;
  readonly correlationId: string;
}

/** Côté écriture : un run est ouvert à la première ingestion qui le référence. */
export interface SearchRunRepository {
  /** Crée le run s'il n'existe pas encore ; sans effet sinon (idempotent). */
  ensureStarted(run: StartSearchRun): Promise<void>;
}

export interface SearchRunSummary {
  readonly id: string;
  readonly status: SearchRunStatus;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
  readonly eventCount: number;
  readonly warningCount: number;
}

/** Côté lecture : projections dédiées aux écrans, sans passer par le modèle d'écriture. */
export interface SearchRunQueries {
  listRecent(limit: number): Promise<readonly SearchRunSummary[]>;
}
