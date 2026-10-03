import type { DomainViolation } from '../../shared/DomainViolation';
import { violation } from '../../shared/DomainViolation';
import type { Result } from '../../shared/Result';
import { err, ok } from '../../shared/Result';

const MAX_SQUARE_METERS = 100_000;

/** Surface habitable en m², strictement positive, arrondie au centième. */
export class Surface {
  private constructor(readonly squareMeters: number) {
    Object.freeze(this);
  }

  static fromSquareMeters(value: number): Result<Surface, DomainViolation> {
    if (!Number.isFinite(value) || value <= 0) {
      return err(violation('SURFACE_INVALID', 'Surface must be a positive number of m².'));
    }
    if (value > MAX_SQUARE_METERS) {
      return err(violation('SURFACE_OUT_OF_RANGE', `Surface exceeds ${MAX_SQUARE_METERS} m².`));
    }
    return ok(new Surface(Math.round(value * 100) / 100));
  }

  /** Vrai si l'écart relatif entre deux surfaces est inférieur ou égal à `tolerancePercent`. */
  isCloseTo(other: Surface, tolerancePercent: number): boolean {
    const larger = Math.max(this.squareMeters, other.squareMeters);
    const delta = Math.abs(this.squareMeters - other.squareMeters);
    return (delta / larger) * 100 <= tolerancePercent;
  }

  equals(other: Surface): boolean {
    return this.squareMeters === other.squareMeters;
  }

  toJSON(): number {
    return this.squareMeters;
  }
}
