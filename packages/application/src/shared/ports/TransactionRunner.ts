/**
 * Exécute un groupe d'écritures de manière atomique. `TScope` expose les repositories liés à la
 * transaction : un use case ne voit jamais la connexion ni le SQL sous-jacents.
 */
export interface TransactionRunner<TScope> {
  runInTransaction<T>(work: (scope: TScope) => Promise<T>): Promise<T>;
}
