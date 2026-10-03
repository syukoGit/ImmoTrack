import { randomUUID } from 'node:crypto';

import type { IdGenerator } from '@immotrack/application';

export class RandomUuidGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
