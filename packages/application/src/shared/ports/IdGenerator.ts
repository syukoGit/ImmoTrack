/** Génère des identifiants techniques (UUID) : injecté pour rendre les tests déterministes. */
export interface IdGenerator {
  generate(): string;
}
