import { z } from 'zod';

export const AGENT_INGESTION_SCHEMA_VERSION = '1.0';

/** Limites de taille du contrat : bornent le coût d'une requête serverless. */
export const AGENT_INGESTION_LIMITS = {
  maxListings: 500,
  maxErrors: 100,
  maxRawFactsKeys: 100,
} as const;

const sourceCode = z
  .string()
  .regex(/^[a-z0-9][a-z0-9_-]{1,49}$/, 'Must be a lowercase slug (a-z, 0-9, "-", "_").');

const httpUrl = z
  .url({ protocol: /^https?$/, hostname: z.regexes.domain })
  .max(2048, 'URL must not exceed 2048 characters.');

export const agentListingV1Schema = z.strictObject({
  sourceReference: z.string().trim().min(1).max(200),
  url: httpUrl,
  title: z.string().trim().min(1).max(500),
  price: z.number().positive(),
  surfaceM2: z.number().positive().nullish(),
  city: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().max(10).nullish(),
  rawFacts: z
    .record(z.string().max(100), z.unknown())
    .refine((facts) => Object.keys(facts).length <= AGENT_INGESTION_LIMITS.maxRawFactsKeys, {
      message: `rawFacts must not contain more than ${AGENT_INGESTION_LIMITS.maxRawFactsKeys} keys.`,
    })
    .optional(),
});

export const agentReportedErrorV1Schema = z.strictObject({
  code: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(2000),
  url: httpUrl.optional(),
});

export const agentSourceStatusV1Schema = z.enum(['SUCCESS', 'PARTIAL_SUCCESS', 'FAILED']);

export const agentIngestionBatchV1Schema = z.strictObject({
  schemaVersion: z.literal(AGENT_INGESTION_SCHEMA_VERSION),
  idempotencyKey: z
    .string()
    .min(8)
    .max(200)
    .regex(/^[A-Za-z0-9._:-]+$/, 'Allowed characters: letters, digits, ".", "_", ":", "-".'),
  runId: z.uuid(),
  source: z.strictObject({
    code: sourceCode,
    status: agentSourceStatusV1Schema,
  }),
  observedAt: z.iso.datetime({ offset: true }),
  listings: z.array(agentListingV1Schema).max(AGENT_INGESTION_LIMITS.maxListings),
  errors: z.array(agentReportedErrorV1Schema).max(AGENT_INGESTION_LIMITS.maxErrors),
});

export type AgentIngestionBatchV1 = z.infer<typeof agentIngestionBatchV1Schema>;
export type AgentListingV1 = z.infer<typeof agentListingV1Schema>;
export type AgentReportedErrorV1 = z.infer<typeof agentReportedErrorV1Schema>;
export type AgentSourceStatusV1 = z.infer<typeof agentSourceStatusV1Schema>;
