import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  renderAgentIngestionExample,
  renderAgentIngestionJsonSchema,
} from '../src/agent-ingestion/v1/jsonSchema';

const docsApi = new URL('../../../docs/api/', import.meta.url);
const outputs = [
  ['agent-ingestion.v1.schema.json', renderAgentIngestionJsonSchema()],
  ['examples/agent-ingestion.v1.json', renderAgentIngestionExample()],
] as const;

mkdirSync(new URL('examples/', docsApi), { recursive: true });
for (const [path, content] of outputs) {
  const target = fileURLToPath(new URL(path, docsApi));
  writeFileSync(target, content);
  console.log(`Written ${target}`);
}
