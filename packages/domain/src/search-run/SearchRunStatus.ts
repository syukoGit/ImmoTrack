export const SOURCE_RUN_STATUSES = ['SUCCESS', 'PARTIAL_SUCCESS', 'FAILED'] as const;

/** Statut d'une source au sein d'un run, tel que rapporté par l'agent. */
export type SourceRunStatus = (typeof SOURCE_RUN_STATUSES)[number];

/** Statut global d'un run : en cours puis agrégé à partir du statut de chaque source. */
export type SearchRunStatus = 'RUNNING' | SourceRunStatus;

export type AgentEventLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Agrège le statut des sources : une source en erreur n'invalide pas les autres
 * (succès partiel), seul l'échec de toutes les sources rend le run FAILED.
 */
export const deriveSearchRunStatus = (
  sourceStatuses: readonly SourceRunStatus[],
): SearchRunStatus => {
  if (sourceStatuses.length === 0) {
    return 'RUNNING';
  }
  if (sourceStatuses.every((status) => status === 'SUCCESS')) {
    return 'SUCCESS';
  }
  if (sourceStatuses.every((status) => status === 'FAILED')) {
    return 'FAILED';
  }
  return 'PARTIAL_SUCCESS';
};
