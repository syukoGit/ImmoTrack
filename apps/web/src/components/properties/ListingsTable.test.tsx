// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ListingsTable } from './ListingsTable';

describe('ListingsTable', () => {
  it('explains why the table is empty', () => {
    render(<ListingsTable listings={[]} />);
    expect(screen.getByText(/Aucun bien pour le moment/)).toBeInTheDocument();
  });

  it('formats price, surface and location', () => {
    render(
      <ListingsTable
        listings={[
          {
            id: 'l-1',
            title: 'T2 proche gare',
            city: 'Tours',
            postalCode: '37000',
            priceCents: 9_200_000,
            surfaceM2: 41.5,
            status: 'NEW',
            lastSeenAt: new Date('2026-10-03T04:12:00Z'),
          },
        ]}
      />,
    );
    expect(screen.getByRole('columnheader', { name: 'Rendement' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Tours (37000)' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /92\s000\s€/ })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '41,5 m²' })).toBeInTheDocument();
  });
});
