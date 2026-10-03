/**
 * Jeu de critères versionné. Une nouvelle version est créée à chaque modification afin que
 * chaque run reste rattaché aux critères exacts avec lesquels il a été exécuté.
 */
export interface SearchZone {
  readonly city: string;
  readonly postalCodes: readonly string[];
  readonly priority: 'PRIMARY' | 'SECONDARY';
}

export interface SearchCriteria {
  readonly zones: readonly SearchZone[];
  readonly maxPriceEuros: number | null;
  readonly minSurfaceM2: number | null;
  readonly minGrossYieldPercent: number | null;
}

export interface SearchCriteriaVersion {
  readonly id: string;
  readonly version: number;
  readonly criteria: SearchCriteria;
  readonly activeFrom: Date;
}
