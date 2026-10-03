import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <h1>Tableau de bord</h1>
      <p className="muted">
        Socle technique V1 : les données proviennent des lots envoyés par les agents IA via
        l&apos;interface d&apos;ingestion.
      </p>
      <ul>
        <li>
          <Link href="/properties">Biens</Link> — biens consolidés et leur statut de qualification.
        </li>
        <li>
          <Link href="/runs">Runs</Link> — exécutions de recherche, événements et erreurs.
        </li>
        <li>
          <Link href="/agent-ingest">Ingestion agent</Link> — dépôt manuel d&apos;un lot JSON
          (contrat v1.0).
        </li>
      </ul>
    </>
  );
}
