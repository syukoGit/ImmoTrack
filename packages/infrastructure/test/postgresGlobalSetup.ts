import { createPostgresGlobalSetup } from '@immotrack/test-utils/postgres';

export default createPostgresGlobalSetup('immotrack_it_infrastructure');

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}
