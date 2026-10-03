// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RunsTable } from './RunsTable';

describe('RunsTable', () => {
  it('shows an explicit empty state', () => {
    render(<RunsTable runs={[]} />);
    expect(screen.getByText('Aucun run enregistré pour le moment.')).toBeInTheDocument();
  });

  it('renders one row per run with a readable status and highlighted warnings', () => {
    render(
      <RunsTable
        runs={[
          {
            id: '0b9f6d0e-3c1a-4d8e-9a43-6f1d2c7b8a90',
            status: 'PARTIAL_SUCCESS',
            startedAt: new Date('2026-10-03T04:12:00Z'),
            completedAt: null,
            eventCount: 3,
            warningCount: 2,
          },
        ]}
      />,
    );
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2);
    const cells = within(rows[1]!).getAllByRole('cell');
    expect(cells.map((cell) => cell.textContent)).toEqual([
      '0b9f6d0e',
      'Succès partiel',
      '03/10/2026 06:12',
      '—',
      '3',
      '2',
    ]);
    expect(cells[5]).toHaveClass('error');
  });
});
