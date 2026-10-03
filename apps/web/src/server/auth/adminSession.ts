import 'server-only';

import type { AdminIdentity } from '@immotrack/infrastructure/auth';
import { SupabaseIdentityAdapter } from '@immotrack/infrastructure/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { loadAuthConfig } from '../config/serverConfig';

export type AdminViewer =
  | { readonly kind: 'admin'; readonly identity: AdminIdentity }
  | {
      readonly kind: 'auth-disabled';
    };

export const createIdentityAdapter = async (): Promise<SupabaseIdentityAdapter | null> => {
  const config = loadAuthConfig();
  if (config.mode === 'disabled') {
    return null;
  }
  const cookieStore = await cookies();
  return new SupabaseIdentityAdapter(config.supabase, {
    getAll: () => cookieStore.getAll(),
    setAll: (toSet) => {
      try {
        for (const { name, value, options } of toSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Appel depuis un Server Component : les cookies sont rafraîchis par le proxy.
      }
    },
  });
};

/** Contrôle d'accès autoritaire des pages métier (le proxy n'est qu'une redirection optimiste). */
export const requireAdmin = async (): Promise<AdminViewer> => {
  const adapter = await createIdentityAdapter();
  if (adapter === null) {
    return { kind: 'auth-disabled' };
  }
  const identity = await adapter.getCurrentAdmin();
  if (identity === null) {
    redirect('/login');
  }
  return { kind: 'admin', identity };
};
