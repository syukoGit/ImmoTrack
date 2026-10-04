/**
 * Erreur technique (base indisponible, timeout…) levée par un adaptateur sortant. Elle est
 * distincte des refus métier, qui sont renvoyés comme résultats typés par les use cases.
 */
export class InfrastructureError extends Error {
  override readonly name = 'InfrastructureError';
}
