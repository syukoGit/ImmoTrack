import { describe, expect, it } from 'vitest';

import { ConfigurationError, loadAuthConfig, loadServerConfig } from './serverConfig';

const HASH = 'a'.repeat(64);

describe('loadServerConfig', () => {
  it('applies defaults and parses rotation-friendly token hashes', () => {
    const config = loadServerConfig({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      AGENT_INGESTION_TOKEN_SHA256: ` ${HASH.toUpperCase()}, ${'b'.repeat(64)} ,`,
    });
    expect(config).toEqual({
      logLevel: 'info',
      databaseUrl: 'postgresql://user:pass@localhost:5432/db',
      databasePoolMax: 3,
      agentTokenHashes: [HASH, 'b'.repeat(64)],
      agentIngestionMaxBodyBytes: 1_000_000,
    });
  });

  it('names invalid variables without echoing their values', () => {
    const secretLookingValue = 'mysql://root:SuperSecret@db';
    const load = () =>
      loadServerConfig({ DATABASE_URL: secretLookingValue, AGENT_INGESTION_TOKEN_SHA256: 'raw' });
    expect(load).toThrow(ConfigurationError);
    expect(load).toThrow(/DATABASE_URL, AGENT_INGESTION_TOKEN_SHA256/);
    expect(load).not.toThrow(/SuperSecret/);
  });
});

describe('loadAuthConfig', () => {
  it('defaults to Supabase Auth and requires its variables', () => {
    expect(() => loadAuthConfig({})).toThrow(/SUPABASE_URL/);
    expect(
      loadAuthConfig({
        SUPABASE_URL: 'https://project.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
        ADMIN_EMAIL: 'admin@example.com',
      }),
    ).toEqual({
      mode: 'supabase',
      supabase: {
        url: 'https://project.supabase.co',
        publishableKey: 'sb_publishable_x',
        adminEmail: 'admin@example.com',
      },
    });
  });

  it('allows disabling authentication only outside production', () => {
    expect(loadAuthConfig({ AUTH_MODE: 'disabled', NODE_ENV: 'development' })).toEqual({
      mode: 'disabled',
    });
    expect(() => loadAuthConfig({ AUTH_MODE: 'disabled', NODE_ENV: 'production' })).toThrow(
      ConfigurationError,
    );
  });
});
