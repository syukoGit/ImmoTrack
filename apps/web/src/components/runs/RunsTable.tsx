import { formatDateTime } from '../format';

export interface RunRow {
  readonly id: string;
  readonly status: 'RUNNING' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
  readonly startedAt: Date;
  readonly completedAt: Date | null;
  readonly eventCount: number;
  readonly warningCount: number;
}

const STATUS_LABELS: Record<RunRow['status'], string> = {
  RUNNING: 'En cours',
  SUCCESS: 'Succès',
  PARTIAL_SUCCESS: 'Succès partiel',
  FAILED: 'Échec',
};

export function RunsTable({ runs }: { readonly runs: readonly RunRow[] }) {
  if (runs.length === 0) {
    return <p className="empty">Aucun run enregistré pour le moment.</p>;
  }
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th scope="col">Run</th>
            <th scope="col">Statut</th>
            <th scope="col">Début</th>
            <th scope="col">Fin</th>
            <th scope="col">Événements</th>
            <th scope="col">Alertes</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td>
                <code title={run.id}>{run.id.slice(0, 8)}</code>
              </td>
              <td>{STATUS_LABELS[run.status]}</td>
              <td>{formatDateTime(run.startedAt)}</td>
              <td>{formatDateTime(run.completedAt)}</td>
              <td>{run.eventCount}</td>
              <td className={run.warningCount > 0 ? 'error' : undefined}>{run.warningCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
