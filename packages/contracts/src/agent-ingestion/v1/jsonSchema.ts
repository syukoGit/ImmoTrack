import { z } from 'zod';

import { agentIngestionExampleV1 } from './example';
import { agentIngestionBatchV1Schema } from './schema';

/** Représentation JSON Schema du contrat v1, publiée dans `docs/api` pour les agents. */
export const renderAgentIngestionJsonSchema = (): string =>
  `${JSON.stringify(
    {
      $id: 'https://immotrack.local/schemas/agent-ingestion/1.0.json',
      title: 'ImmoTrack agent ingestion batch v1.0',
      ...z.toJSONSchema(agentIngestionBatchV1Schema, { target: 'draft-2020-12', io: 'input' }),
    },
    null,
    2,
  )}\n`;

/** Exemple de payload publié dans `docs/api/examples`. */
export const renderAgentIngestionExample = (): string =>
  `${JSON.stringify(agentIngestionExampleV1, null, 2)}\n`;
