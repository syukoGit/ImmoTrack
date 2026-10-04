import { createHash, timingSafeEqual } from 'node:crypto';

import type { AgentAuthenticator, AgentIdentity } from '@immotrack/application';

const SHA256_HEX = /^[a-f0-9]{64}$/;
const MIN_TOKEN_LENGTH = 32;

export const hashAgentToken = (token: string): string =>
  createHash('sha256').update(token, 'utf8').digest('hex');

/**
 * Authentification V1 de l'agent par jeton porteur. Seules les empreintes SHA-256 des jetons
 * sont connues du serveur (variable d'environnement), jamais les jetons eux-mêmes. Plusieurs
 * empreintes peuvent être actives simultanément pour permettre une rotation sans interruption.
 */
export class Sha256AgentTokenAuthenticator implements AgentAuthenticator {
  private readonly allowedHashes: readonly Buffer[];

  constructor(tokenHashes: readonly string[]) {
    this.allowedHashes = tokenHashes.map((hash) => {
      const normalized = hash.trim().toLowerCase();
      if (!SHA256_HEX.test(normalized)) {
        throw new Error('Agent token hashes must be SHA-256 hexadecimal digests.');
      }
      return Buffer.from(normalized, 'hex');
    });
  }

  authenticate(credential: string | null): Promise<AgentIdentity | null> {
    if (credential === null || credential.length < MIN_TOKEN_LENGTH) {
      return Promise.resolve(null);
    }
    const presented = Buffer.from(hashAgentToken(credential), 'hex');
    // Comparaison en temps constant sur toutes les empreintes, sans sortie anticipée.
    let matched: Buffer | null = null;
    for (const allowed of this.allowedHashes) {
      if (timingSafeEqual(presented, allowed)) {
        matched = allowed;
      }
    }
    return Promise.resolve(
      matched === null ? null : { agentId: `agent-token:${matched.toString('hex').slice(0, 8)}` },
    );
  }
}
