/**
 * Le domaine est compilé sans `lib: DOM` ni `@types/node` afin de garantir qu'il ne dépend
 * d'aucun runtime (navigateur, Node.js, Next.js). Le parseur d'URL WHATWG est un standard présent
 * dans tous les runtimes JavaScript : on en déclare ici le sous-ensemble utilisé, localement (une
 * déclaration globale entrerait en conflit avec les typages DOM/Node des autres packages).
 */
export interface WhatwgUrl {
  protocol: string;
  username: string;
  password: string;
  port: string;
  pathname: string;
  hash: string;
  readonly searchParams: {
    delete(name: string): void;
    sort(): void;
    keys(): IterableIterator<string>;
  };
  toString(): string;
}

type WhatwgUrlConstructor = new (input: string) => WhatwgUrl;

// Conversion assumée : `URL` est garanti par tous les runtimes cibles mais absent de `lib: ES2023`.
const { URL: UrlConstructor } = globalThis as unknown as { URL: WhatwgUrlConstructor };

export const parseUrl = (input: string): WhatwgUrl => new UrlConstructor(input);
