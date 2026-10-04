#!/usr/bin/env node
// Génère un jeton agent aléatoire (ou hache un jeton fourni sur l'entrée standard) et affiche
// son empreinte SHA-256 à placer dans AGENT_INGESTION_TOKEN_SHA256. Le jeton en clair n'est
// affiché qu'une fois : il doit être conservé dans la configuration de l'agent, jamais dans Git.
import { createHash, randomBytes } from 'node:crypto';

const readStdin = async () => {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8').trim();
};

const provided = await readStdin();
const token = provided || randomBytes(32).toString('base64url');
if (token.length < 32) {
  console.error('Le jeton doit contenir au moins 32 caractères.');
  process.exit(1);
}

const hash = createHash('sha256').update(token, 'utf8').digest('hex');
if (!provided) {
  console.log(`Jeton agent (à transmettre à l'agent, ne pas committer) :\n  ${token}\n`);
}
console.log(`AGENT_INGESTION_TOKEN_SHA256=${hash}`);
