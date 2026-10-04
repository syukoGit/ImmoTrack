import { formatDateTime, formatEurosFromCents, formatSurface } from '../format';

export interface ListingRow {
  readonly id: string;
  readonly title: string | null;
  readonly city: string;
  readonly postalCode: string | null;
  readonly priceCents: number | null;
  readonly surfaceM2: number | null;
  readonly status: string;
  readonly lastSeenAt: Date;
}

export function ListingsTable({ listings }: { readonly listings: readonly ListingRow[] }) {
  if (listings.length === 0) {
    return (
      <p className="empty">
        Aucun bien pour le moment. Les biens apparaîtront après le rapprochement des annonces
        ingérées.
      </p>
    );
  }
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th scope="col">Bien</th>
            <th scope="col">Ville</th>
            <th scope="col">Prix</th>
            <th scope="col">Surface</th>
            <th scope="col">Rendement</th>
            <th scope="col">Cash-flow</th>
            <th scope="col">Score</th>
            <th scope="col">Statut</th>
            <th scope="col">Vu le</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr key={listing.id}>
              <td>{listing.title ?? '—'}</td>
              <td>
                {listing.city}
                {listing.postalCode === null ? '' : ` (${listing.postalCode})`}
              </td>
              <td>{formatEurosFromCents(listing.priceCents)}</td>
              <td>{formatSurface(listing.surfaceM2)}</td>
              <td className="muted">—</td>
              <td className="muted">—</td>
              <td className="muted">—</td>
              <td>{listing.status}</td>
              <td>{formatDateTime(listing.lastSeenAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
