import type { SearchCriteriaVersion } from '@immotrack/domain';

export interface SearchCriteriaRepository {
  findActive(at: Date): Promise<SearchCriteriaVersion | null>;
}
