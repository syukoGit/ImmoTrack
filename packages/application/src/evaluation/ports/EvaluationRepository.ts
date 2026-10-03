/**
 * Hypothèses financières versionnées et immuables : toute modification crée une nouvelle
 * version (`version` croissante par bien) afin que chaque évaluation reste reproductible.
 */
export interface EvaluationInputVersion {
  readonly id: string;
  readonly listingId: string;
  readonly version: number;
  readonly sourceKind: 'OBSERVED' | 'ESTIMATED' | 'MANUAL';
  readonly assumptions: Readonly<Record<string, unknown>>;
  readonly createdAt: Date;
}

export interface EvaluationRecord {
  readonly id: string;
  readonly listingId: string;
  readonly inputId: string;
  readonly calculatorVersion: string;
  readonly metrics: Readonly<Record<string, unknown>>;
  readonly score: number | null;
  readonly scoreBreakdown: readonly { readonly criterion: string; readonly contribution: number }[];
  readonly createdAt: Date;
}

export interface EvaluationRepository {
  findLatestInput(listingId: string): Promise<EvaluationInputVersion | null>;
  appendInput(input: EvaluationInputVersion): Promise<void>;
  appendEvaluation(evaluation: EvaluationRecord): Promise<void>;
}
