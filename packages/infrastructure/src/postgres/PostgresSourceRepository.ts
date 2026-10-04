import type { SourceDescriptor, SourceRepository } from '@immotrack/application';

import type { PgExecutor } from './PgExecutor';
import { query } from './PgExecutor';

export class PostgresSourceRepository implements SourceRepository {
  constructor(private readonly db: PgExecutor) {}

  async findByCode(code: string): Promise<SourceDescriptor | null> {
    const { rows } = await query<SourceDescriptor>(
      this.db,
      'select id, code, name, active from sources where code = $1',
      [code],
    );
    return rows[0] ?? null;
  }
}
