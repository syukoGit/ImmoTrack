import { createTestDatabase } from './testDatabase';

/** Sous-ensemble de `TestProject` (vitest/node) utilisé ici, pour ne pas dépendre de Vitest. */
interface ProvidingProject {
  provide(key: 'databaseUrl', value: string): void;
}

/**
 * Fabrique un `globalSetup` Vitest : une base dédiée par package évite toute interférence entre
 * suites d'intégration. L'URL est transmise aux tests via `inject('databaseUrl')`.
 */
export const createPostgresGlobalSetup =
  (databaseName: string) =>
  async (project: ProvidingProject): Promise<() => Promise<void>> => {
    const database = await createTestDatabase(databaseName);
    project.provide('databaseUrl', database.url);
    return () => database.drop();
  };
