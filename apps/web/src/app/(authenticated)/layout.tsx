import type { ReactNode } from 'react';

import { AppNav } from '@/components/layout/AppNav';
import { requireAdmin } from '@/server/auth/adminSession';

// Pages protégées : rendues à chaque requête, jamais prérendues au build (session + config runtime).
export const dynamic = 'force-dynamic';

export default async function AuthenticatedLayout({ children }: { readonly children: ReactNode }) {
  const viewer = await requireAdmin();
  return (
    <>
      <AppNav
        viewerLabel={
          viewer.kind === 'admin' ? viewer.identity.email : 'Authentification désactivée (dev)'
        }
        canSignOut={viewer.kind === 'admin'}
      />
      <main>{children}</main>
    </>
  );
}
