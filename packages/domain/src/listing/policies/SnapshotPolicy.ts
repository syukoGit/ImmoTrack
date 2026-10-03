import type { ObservedListing } from '../entities/ObservedListing';

export type SnapshotTrackedField = 'price' | 'surface' | 'title' | 'url' | 'city' | 'postalCode';

/**
 * Liste des champs significatifs ayant changé entre deux observations d'une même annonce.
 * Un nouveau snapshot n'est créé que si cette liste est non vide (snapshots append-only).
 */
export const listSignificantChanges = (
  previous: ObservedListing,
  next: ObservedListing,
): readonly SnapshotTrackedField[] => {
  const changes: SnapshotTrackedField[] = [];
  if (!previous.price.equals(next.price)) changes.push('price');
  if (!sameNullable(previous.surface, next.surface, (a, b) => a.equals(b))) changes.push('surface');
  if (previous.title !== next.title) changes.push('title');
  if (!previous.url.equals(next.url)) changes.push('url');
  if (previous.city !== next.city) changes.push('city');
  if (!sameNullable(previous.postalCode, next.postalCode, (a, b) => a.equals(b))) {
    changes.push('postalCode');
  }
  return changes;
};

const sameNullable = <T>(a: T | null, b: T | null, equals: (x: T, y: T) => boolean): boolean =>
  a === null || b === null ? a === b : equals(a, b);
