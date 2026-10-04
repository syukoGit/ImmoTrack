import pg from 'pg';

export interface PostgresPoolConfig {
  readonly connectionString: string;
  /** Faible par défaut : en serverless, chaque instance ouvre son propre pool. */
  readonly maxConnections?: number;
  readonly statementTimeoutMs?: number;
  readonly applicationName?: string;
}

export const createPostgresPool = (config: PostgresPoolConfig): pg.Pool => {
  const pool = new pg.Pool({
    connectionString: config.connectionString,
    max: config.maxConnections ?? 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: config.statementTimeoutMs ?? 10_000,
    application_name: config.applicationName ?? 'immotrack',
  });
  // Une connexion inactive coupée par le serveur ne doit pas faire tomber le processus.
  pool.on('error', () => undefined);
  return pool;
};
