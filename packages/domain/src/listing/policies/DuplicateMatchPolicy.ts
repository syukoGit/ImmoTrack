import type { ObservedListing } from '../entities/ObservedListing';

/**
 * Niveaux de rapprochement déterministes (cf. spécification technique §8). Seuls les niveaux 1
 * et 2, certains par construction, sont implémentés dans le socle ; les niveaux 3 et 4
 * (adresse/surface/type, similarité) produiront des candidats et non des fusions automatiques.
 */
export type ExactMatchLevel = 'SAME_SOURCE_REFERENCE' | 'SAME_CANONICAL_URL';

export type ListingIdentity = Pick<ObservedListing, 'sourceReference' | 'url'>;

export const findExactMatchLevel = (
  candidate: ListingIdentity,
  known: ListingIdentity,
): ExactMatchLevel | null => {
  if (candidate.sourceReference.equals(known.sourceReference)) {
    return 'SAME_SOURCE_REFERENCE';
  }
  if (candidate.url.equals(known.url)) {
    return 'SAME_CANONICAL_URL';
  }
  return null;
};
