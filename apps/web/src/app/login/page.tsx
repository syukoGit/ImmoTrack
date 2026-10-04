import type { Metadata } from 'next';
import Link from 'next/link';

import { LoginForm } from '@/components/auth/LoginForm';
import { loadAuthConfig } from '@/server/config/serverConfig';

export const metadata: Metadata = { title: 'Connexion' };
// La configuration Supabase est lue au runtime : un même build peut cibler plusieurs projets.
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const config = loadAuthConfig();
  return (
    <main>
      <h1>Connexion à ImmoTrack</h1>
      {config.mode === 'supabase' ? (
        <LoginForm
          supabaseUrl={config.supabase.url}
          publishableKey={config.supabase.publishableKey}
        />
      ) : (
        <p className="muted">
          Authentification désactivée en développement local (<code>AUTH_MODE=disabled</code>).{' '}
          <Link href="/">Accéder à l&apos;application</Link>
        </p>
      )}
    </main>
  );
}
