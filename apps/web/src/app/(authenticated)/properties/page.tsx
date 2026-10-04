import type { Metadata } from 'next';

import { ListingsTable } from '@/components/properties/ListingsTable';
import { getContainer } from '@/server/composition/container';

export const metadata: Metadata = { title: 'Biens' };
export const dynamic = 'force-dynamic';

export default async function PropertiesPage() {
  const listings = await getContainer().useCases.listListingSummaries.execute({ limit: 100 });
  return (
    <>
      <h1>Biens</h1>
      <p className="muted">
        Filtres, tri, évaluation financière et scoring seront ajoutés avec les modules
        correspondants.
      </p>
      <ListingsTable listings={listings} />
    </>
  );
}
