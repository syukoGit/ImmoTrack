import type { Metadata } from 'next';

import { RunsTable } from '@/components/runs/RunsTable';
import { getContainer } from '@/server/composition/container';

export const metadata: Metadata = { title: 'Runs' };
export const dynamic = 'force-dynamic';

export default async function RunsPage() {
  const runs = await getContainer().useCases.listSearchRuns.execute({ limit: 50 });
  return (
    <>
      <h1>Runs de recherche</h1>
      <p className="muted">
        50 dernières exécutions, ouvertes à la première ingestion d&apos;un lot.
      </p>
      <RunsTable runs={runs} />
    </>
  );
}
