import Link from 'next/link';

export interface AppNavProps {
  readonly viewerLabel: string;
  readonly canSignOut: boolean;
}

export function AppNav({ viewerLabel, canSignOut }: AppNavProps) {
  return (
    <nav className="app-nav" aria-label="Navigation principale">
      <Link href="/" className="brand">
        ImmoTrack
      </Link>
      <Link href="/properties">Biens</Link>
      <Link href="/runs">Runs</Link>
      <Link href="/agent-ingest">Ingestion agent</Link>
      <span className="muted">{viewerLabel}</span>
      {canSignOut && (
        <form action="/auth/signout" method="post">
          <button type="submit">Se déconnecter</button>
        </form>
      )}
    </nav>
  );
}
