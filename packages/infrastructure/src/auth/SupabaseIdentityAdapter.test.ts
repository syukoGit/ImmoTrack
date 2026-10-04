import { describe, expect, it, vi } from 'vitest';

import { isAdminEmail, SupabaseIdentityAdapter } from './SupabaseIdentityAdapter';

describe('SupabaseIdentityAdapter', () => {
  it('returns no admin without contacting Supabase when no session cookie is present', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const adapter = new SupabaseIdentityAdapter(
      { url: 'http://127.0.0.1:1', publishableKey: 'public-key', adminEmail: 'admin@example.com' },
      { getAll: () => [{ name: 'theme', value: 'dark' }], setAll: () => undefined },
    );
    expect(await adapter.getCurrentAdmin()).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('matches the single administrator email case-insensitively', () => {
    expect(isAdminEmail(' Admin@Example.com ', 'admin@example.com')).toBe(true);
    expect(isAdminEmail('other@example.com', 'admin@example.com')).toBe(false);
  });
});
