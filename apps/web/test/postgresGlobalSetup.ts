import { createPostgresGlobalSetup } from '@immotrack/test-utils/postgres';

export default createPostgresGlobalSetup('immotrack_it_web');

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}
