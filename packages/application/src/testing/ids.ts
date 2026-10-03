import type { IdGenerator } from '../shared/ports/IdGenerator';

/** Génère des UUID v4 syntaxiquement valides et prévisibles : 00000000-0000-4000-8000-000000000001… */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  generate(): string {
    this.counter += 1;
    return `00000000-0000-4000-8000-${this.counter.toString().padStart(12, '0')}`;
  }
}
