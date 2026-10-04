import type { TransactionRunner } from '@immotrack/application';
import { InfrastructureError } from '@immotrack/application';
import type pg from 'pg';

import type { PgExecutor } from './PgExecutor';

export class PostgresTransactionRunner<TScope> implements TransactionRunner<TScope> {
  constructor(
    private readonly pool: pg.Pool,
    private readonly createScope: (executor: PgExecutor) => TScope,
  ) {}

  async runInTransaction<T>(work: (scope: TScope) => Promise<T>): Promise<T> {
    let client: pg.PoolClient;
    try {
      client = await this.pool.connect();
    } catch (error) {
      throw new InfrastructureError('Database connection failed.', { cause: error });
    }
    try {
      await client.query('begin');
      const result = await work(this.createScope(client));
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
}
