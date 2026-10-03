import { describe, expect, it } from 'vitest';

import { hashAgentToken, Sha256AgentTokenAuthenticator } from './Sha256AgentTokenAuthenticator';

const TOKEN = 'agent-token-0123456789-abcdefghijklmnop';
const ROTATED_TOKEN = 'rotated-token-0123456789-abcdefghijklmn';

describe('Sha256AgentTokenAuthenticator', () => {
  it('authenticates a token whose hash is configured', async () => {
    const authenticator = new Sha256AgentTokenAuthenticator([hashAgentToken(TOKEN)]);
    const identity = await authenticator.authenticate(TOKEN);
    expect(identity?.agentId).toBe(`agent-token:${hashAgentToken(TOKEN).slice(0, 8)}`);
    expect(identity?.agentId).not.toContain(TOKEN);
  });

  it('supports several active hashes for rotation', async () => {
    const authenticator = new Sha256AgentTokenAuthenticator([
      hashAgentToken(TOKEN),
      hashAgentToken(ROTATED_TOKEN).toUpperCase(),
    ]);
    expect(await authenticator.authenticate(TOKEN)).not.toBeNull();
    expect(await authenticator.authenticate(ROTATED_TOKEN)).not.toBeNull();
  });

  it.each([null, '', 'short', `${TOKEN}x`])('rejects credential %j', async (credential) => {
    const authenticator = new Sha256AgentTokenAuthenticator([hashAgentToken(TOKEN)]);
    expect(await authenticator.authenticate(credential)).toBeNull();
  });

  it('rejects everything when no hash is configured', async () => {
    expect(await new Sha256AgentTokenAuthenticator([]).authenticate(TOKEN)).toBeNull();
  });

  it('refuses a configuration that is not a SHA-256 digest (e.g. a raw token)', () => {
    expect(() => new Sha256AgentTokenAuthenticator([TOKEN])).toThrow(/SHA-256/);
  });
});
