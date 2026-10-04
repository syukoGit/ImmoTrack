import type { DomainViolation } from '../../shared/DomainViolation';
import { violation } from '../../shared/DomainViolation';
import type { Result } from '../../shared/Result';
import { err, ok } from '../../shared/Result';
import { requireText } from '../../shared/text';
import { Money } from '../../shared/value-objects/Money';
import { CanonicalUrl } from '../value-objects/CanonicalUrl';
import { PostalCode } from '../value-objects/PostalCode';
import { SourceReference } from '../value-objects/SourceReference';
import { Surface } from '../value-objects/Surface';

const MAX_TITLE_LENGTH = 500;
const MAX_CITY_LENGTH = 120;

/** Données primitives d'une annonce telle qu'observée sur une source, avant normalisation. */
export interface ObservedListingInput {
  readonly sourceCode: string;
  readonly sourceReference: string;
  readonly url: string;
  readonly title: string;
  readonly priceEuros: number;
  readonly surfaceM2: number | null;
  readonly city: string;
  readonly postalCode: string | null;
  readonly observedAt: Date;
}

/** Observation normalisée et validée d'une annonce : base des snapshots et du rapprochement. */
export interface ObservedListing {
  readonly sourceReference: SourceReference;
  readonly url: CanonicalUrl;
  readonly title: string;
  readonly price: Money;
  readonly surface: Surface | null;
  readonly city: string;
  readonly postalCode: PostalCode | null;
  readonly observedAt: Date;
}

/** Valide l'ensemble des champs et renvoie toutes les violations, pas seulement la première. */
export const createObservedListing = (
  input: ObservedListingInput,
): Result<ObservedListing, readonly DomainViolation[]> => {
  const violations: DomainViolation[] = [];
  const collect = <T>(result: Result<T, DomainViolation>, field: string): T | undefined => {
    if (result.ok) {
      return result.value;
    }
    violations.push({ ...result.error, field: result.error.field ?? field });
    return undefined;
  };

  const sourceReference = collect(
    SourceReference.create(input.sourceCode, input.sourceReference),
    'sourceReference',
  );
  const url = collect(CanonicalUrl.create(input.url), 'url');
  const title = collect(requireText(input.title, 'title', MAX_TITLE_LENGTH), 'title');
  const city = collect(requireText(input.city, 'city', MAX_CITY_LENGTH), 'city');
  const price = collect(Money.fromEuros(input.priceEuros), 'price');
  if (price !== undefined && !price.isPositive()) {
    violations.push(violation('MONEY_NOT_POSITIVE', 'Price must be positive.', 'price'));
  }
  const surface =
    input.surfaceM2 === null
      ? null
      : collect(Surface.fromSquareMeters(input.surfaceM2), 'surfaceM2');
  const postalCode =
    input.postalCode === null ? null : collect(PostalCode.create(input.postalCode), 'postalCode');
  if (Number.isNaN(input.observedAt.getTime())) {
    violations.push(violation('DATE_INVALID', 'Observation date is invalid.', 'observedAt'));
  }

  if (
    violations.length > 0 ||
    sourceReference === undefined ||
    url === undefined ||
    title === undefined ||
    city === undefined ||
    price === undefined ||
    surface === undefined ||
    postalCode === undefined
  ) {
    return err(violations);
  }

  return ok(
    Object.freeze({
      sourceReference,
      url,
      title,
      price,
      surface,
      city,
      postalCode,
      observedAt: new Date(input.observedAt.getTime()),
    }),
  );
};
