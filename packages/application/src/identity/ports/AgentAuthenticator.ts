/** Identité technique d'un agent d'ingestion authentifié (jamais le secret lui-même). */
export interface AgentIdentity {
  readonly agentId: string;
}

/**
 * Authentifie un agent à partir de l'identifiant présenté par le canal entrant (V1 : jeton
 * porteur). Le contrat est volontairement minimal pour pouvoir substituer OAuth, MCP ou une
 * authentification machine-to-machine sans toucher aux use cases.
 */
export interface AgentAuthenticator {
  authenticate(credential: string | null): Promise<AgentIdentity | null>;
}
