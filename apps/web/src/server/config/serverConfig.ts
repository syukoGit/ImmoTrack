import { z } from 'zod';

/** Erreur de configuration : le message ne cite que des noms de variables, jamais des valeurs. */
export class ConfigurationError extends Error {
  override readonly name = 'ConfigurationError';
}

type Env = Readonly<Record<string, string | undefined>>;

const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error']).default('info');

const failOn = (error: z.ZodError, scope: string): never => {
  const variables = [...new Set(error.issues.map((issue) => issue.path.join('.')))];
  throw new ConfigurationError(`Invalid ${scope} configuration: ${variables.join(', ')}.`);
};

// ---------------------------------------------------------------------------
// Authentification administrateur (Supabase Auth)
// ---------------------------------------------------------------------------

export type AuthConfig =
  | {
      readonly mode: 'supabase';
      readonly supabase: { url: string; publishableKey: string; adminEmail: string };
    }
  | { readonly mode: 'disabled' };

const authEnvSchema = z.discriminatedUnion('AUTH_MODE', [
  z.object({
    AUTH_MODE: z.literal('supabase'),
    SUPABASE_URL: z.url(),
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    ADMIN_EMAIL: z.email(),
  }),
  z.object({ AUTH_MODE: z.literal('disabled') }),
]);

/**
 * `AUTH_MODE=disabled` n'existe que pour le développement local sans Supabase ; il est refusé
 * dès que NODE_ENV vaut `production` (build Vercel, `next start`).
 */
export const loadAuthConfig = (env: Env = process.env): AuthConfig => {
  const parsed = authEnvSchema.safeParse({ ...env, AUTH_MODE: env.AUTH_MODE ?? 'supabase' });
  if (!parsed.success) {
    return failOn(parsed.error, 'authentication');
  }
  if (parsed.data.AUTH_MODE === 'disabled') {
    if (env.NODE_ENV === 'production') {
      throw new ConfigurationError('AUTH_MODE=disabled is not allowed in production.');
    }
    return { mode: 'disabled' };
  }
  return {
    mode: 'supabase',
    supabase: {
      url: parsed.data.SUPABASE_URL,
      publishableKey: parsed.data.SUPABASE_PUBLISHABLE_KEY,
      adminEmail: parsed.data.ADMIN_EMAIL,
    },
  };
};

// ---------------------------------------------------------------------------
// Serveur applicatif (base de données, ingestion agent)
// ---------------------------------------------------------------------------

export interface ServerConfig {
  readonly logLevel: z.infer<typeof logLevelSchema>;
  readonly databaseUrl: string;
  readonly databasePoolMax: number;
  readonly agentTokenHashes: readonly string[];
  readonly agentIngestionMaxBodyBytes: number;
}

const serverEnvSchema = z.object({
  LOG_LEVEL: logLevelSchema,
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'Must be a PostgreSQL connection URL.'),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(3),
  AGENT_INGESTION_TOKEN_SHA256: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((hash) => hash.trim().toLowerCase())
        .filter((hash) => hash !== ''),
    )
    .pipe(z.array(z.string().regex(/^[a-f0-9]{64}$/, 'Must be SHA-256 hex digests.'))),
  AGENT_INGESTION_MAX_BODY_BYTES: z.coerce
    .number()
    .int()
    .min(1_024)
    .max(4_000_000)
    .default(1_000_000),
});

export const loadServerConfig = (env: Env = process.env): ServerConfig => {
  const parsed = serverEnvSchema.safeParse(env);
  if (!parsed.success) {
    return failOn(parsed.error, 'server');
  }
  return {
    logLevel: parsed.data.LOG_LEVEL,
    databaseUrl: parsed.data.DATABASE_URL,
    databasePoolMax: parsed.data.DATABASE_POOL_MAX,
    agentTokenHashes: parsed.data.AGENT_INGESTION_TOKEN_SHA256,
    agentIngestionMaxBodyBytes: parsed.data.AGENT_INGESTION_MAX_BODY_BYTES,
  };
};

export const readLogLevel = (env: Env = process.env): ServerConfig['logLevel'] => {
  const parsed = logLevelSchema.safeParse(env.LOG_LEVEL);
  return parsed.success ? parsed.data : 'info';
};
