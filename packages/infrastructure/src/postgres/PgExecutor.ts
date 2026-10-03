import { InfrastructureError } from '@immotrack/application';
import type pg from 'pg';

/** Pool ou client en transaction : les repositories ignorent dans quel contexte ils s'exécutent. */
export type PgExecutor = Pick<pg.Pool | pg.PoolClient, 'query'>;

/** Exécute une requête paramétrée et convertit toute erreur pilote en `InfrastructureError`. */
export const query = async <Row extends pg.QueryResultRow>(
  executor: PgExecutor,
  text: string,
  values: readonly unknown[] = [],
): Promise<pg.QueryResult<Row>> => {
  try {
    return await executor.query<Row>(text, [...values]);
  } catch (error) {
    throw new InfrastructureError('Database query failed.', { cause: error });
  }
};
