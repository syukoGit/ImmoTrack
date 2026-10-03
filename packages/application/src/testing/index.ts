/**
 * Doublures des ports applicatifs pour les tests (in-memory, horloge et identifiants
 * déterministes). Réservé aux tests : la règle dependency-cruiser `application-testing-only-in-tests`
 * interdit son import depuis le code de production.
 */
export { buildIngestAgentBatchCommand, LEBONCOIN_SOURCE } from './builders';
export { ManualClock } from './clock';
export { StableJsonHasher } from './hasher';
export { SequentialIdGenerator } from './ids';
export { InMemoryIngestionStore } from './inMemoryIngestionStore';
export type { RecordedLog } from './logger';
export { RecordingLogger } from './logger';
