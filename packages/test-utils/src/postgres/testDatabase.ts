import { readdirSync, readFileSync } from 'node:fs';

import pg from 'pg';

const REPOSITORY_ROOT = new URL('../../../../', import.meta.url);
const MIGRATIONS_DIRECTORY = new URL('supabase/migrations/', REPOSITORY_ROOT);
const SEED_FILE = new URL('supabase/seed.sql', REPOSITORY_ROOT);
const DATABASE_NAME = /^[a-z_][a-z0-9_]{0,62}$/;

export interface TestDatabase {
  readonly url: string;
  drop(): Promise<void>;
}

const readAdminUrl = (): string => {
  const url = process.env.TEST_DATABASE_URL;
  if (url === undefined || url === '') {
    throw new Error(
      'TEST_DATABASE_URL must point to a PostgreSQL server for integration tests ' +
        '(ex. postgresql://postgres:postgres@127.0.0.1:54322/postgres). See README.',
    );
  }
  return url;
};

const withDatabase = (url: string, database: string): string => {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
};

const withClient = async <T>(url: string, work: (client: pg.Client) => Promise<T>): Promise<T> => {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
};

/** Applique, dans l'ordre lexicographique, toutes les migrations versionnées puis le seed. */
export const applyMigrationsAndSeed = async (url: string): Promise<readonly string[]> => {
  const migrations = readdirSync(MIGRATIONS_DIRECTORY)
    .filter((file) => file.endsWith('.sql'))
    .sort();
  await withClient(url, async (client) => {
    for (const file of migrations) {
      const sql = readFileSync(new URL(file, MIGRATIONS_DIRECTORY), 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('commit');
      } catch (error) {
        await client.query('rollback');
        throw new Error(`Migration ${file} failed`, { cause: error });
      }
    }
    await client.query(readFileSync(SEED_FILE, 'utf8'));
  });
  return migrations;
};

/** Crée une base vierge dédiée (supprimée si elle existe) et y applique migrations et seed. */
export const createTestDatabase = async (name: string): Promise<TestDatabase> => {
  if (!DATABASE_NAME.test(name)) {
    throw new Error(`Invalid test database name: ${name}`);
  }
  const adminUrl = readAdminUrl();
  await withClient(adminUrl, async (client) => {
    await client.query(`drop database if exists ${name} with (force)`);
    await client.query(`create database ${name}`);
  });
  const url = withDatabase(adminUrl, name);
  await applyMigrationsAndSeed(url);
  return {
    url,
    drop: () =>
      withClient(adminUrl, async (client) => {
        await client.query(`drop database if exists ${name} with (force)`);
      }),
  };
};

/** Vide les tables transactionnelles en conservant le référentiel issu du seed. */
export const resetTransactionalTables = async (pool: pg.Pool): Promise<void> => {
  await pool.query(
    'truncate table agent_events, ingestion_requests, search_source_runs, search_runs, ' +
      'evaluations, evaluation_inputs, listing_snapshots, listing_sources, listings, audit_events ' +
      'restart identity cascade',
  );
};
