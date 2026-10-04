/** Trace d'une action administrateur modifiant des hypothèses, un statut ou des données. */
export interface AuditEntry {
  readonly id: string;
  readonly actorId: string;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

export interface AuditTrail {
  record(entry: AuditEntry): Promise<void>;
}
