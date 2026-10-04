export interface SourceDescriptor {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly active: boolean;
}

/** Référentiel des sources autorisées (portails, agences, enchères). */
export interface SourceRepository {
  findByCode(code: string): Promise<SourceDescriptor | null>;
}
