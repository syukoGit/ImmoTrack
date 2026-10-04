import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';

export interface SessionCookie {
  readonly name: string;
  readonly value: string;
}

/** Abstraction des cookies de la requête/réponse, indépendante du framework HTTP. */
export interface SessionCookieStore {
  getAll(): SessionCookie[];
  setAll(cookies: { name: string; value: string; options: CookieOptions }[]): void;
}

export interface SupabaseAuthConfig {
  readonly url: string;
  readonly publishableKey: string;
  readonly adminEmail: string;
}

export interface AdminIdentity {
  readonly userId: string;
  readonly email: string;
}

/**
 * Adaptateur Supabase Auth pour l'administrateur unique de la V1. Utilise exclusivement la clé
 * publiable (jamais la clé service_role) et vérifie que l'utilisateur connecté est bien
 * l'administrateur configuré.
 */
export class SupabaseIdentityAdapter {
  constructor(
    private readonly config: SupabaseAuthConfig,
    private readonly cookies: SessionCookieStore,
  ) {}

  async getCurrentAdmin(): Promise<AdminIdentity | null> {
    if (!hasSessionCookie(this.cookies.getAll())) {
      return null;
    }
    const { data, error } = await this.client().auth.getClaims();
    if (error !== null || data === null) {
      return null;
    }
    const { sub, email } = data.claims;
    if (typeof email !== 'string' || !isAdminEmail(email, this.config.adminEmail)) {
      return null;
    }
    return { userId: sub, email };
  }

  async signOut(): Promise<void> {
    await this.client().auth.signOut();
  }

  private client() {
    return createServerClient(this.config.url, this.config.publishableKey, {
      cookies: {
        getAll: () => this.cookies.getAll(),
        setAll: (cookies) => this.cookies.setAll(cookies),
      },
    });
  }
}

export const isAdminEmail = (email: string, adminEmail: string): boolean =>
  email.trim().toLowerCase() === adminEmail.trim().toLowerCase();

const hasSessionCookie = (cookies: readonly SessionCookie[]): boolean =>
  cookies.some(({ name }) => name.startsWith('sb-') && name.includes('-auth-token'));
