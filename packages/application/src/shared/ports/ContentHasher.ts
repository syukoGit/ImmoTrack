/** Empreinte stable (SHA-256 hexadécimal) d'une valeur JSON, indépendante de l'ordre des clés. */
export interface ContentHasher {
  hash(value: unknown): string;
}
