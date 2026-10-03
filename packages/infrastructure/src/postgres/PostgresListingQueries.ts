import type { ListingQueries, ListingSummary } from '@immotrack/application';
import type { ListingStatus } from '@immotrack/domain';

import type { PgExecutor } from './PgExecutor';
import { query } from './PgExecutor';

interface ListingSummaryRow {
  id: string;
  title: string | null;
  city: string;
  postal_code: string | null;
  price_cents: string | null;
  surface_m2: string | null;
  status: ListingStatus;
  last_seen_at: Date;
}

export class PostgresListingQueries implements ListingQueries {
  constructor(private readonly db: PgExecutor) {}

  async listRecent(limit: number): Promise<readonly ListingSummary[]> {
    const { rows } = await query<ListingSummaryRow>(
      this.db,
      `select id, title, city, postal_code, price_cents, surface_m2, status, last_seen_at
         from listings
        order by last_seen_at desc
        limit $1`,
      [limit],
    );
    // bigint et numeric sont renvoyés en texte par le pilote pour ne pas perdre de précision.
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      city: row.city,
      postalCode: row.postal_code,
      priceCents: row.price_cents === null ? null : Number(row.price_cents),
      surfaceM2: row.surface_m2 === null ? null : Number(row.surface_m2),
      status: row.status,
      lastSeenAt: row.last_seen_at,
    }));
  }
}
