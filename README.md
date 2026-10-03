# ImmoTrack

Application personnelle de recherche et d'analyse d'investissements immobiliers. Des agents IA
externes (initialement ChatGPT Work) recherchent des annonces et envoient des lots JSON ;
ImmoTrack est la **source de vérité** : persistance, déduplication, historique, calculs
financiers, scoring, logs et diagnostic.

> **État : socle V1.** Ce dépôt contient l'architecture, le tooling et une première tranche
> verticale (`IngestAgentBatch`). Les fonctionnalités métier (rapprochement complet, snapshots,
> évaluation, scoring, écrans complets) sont à construire sur ce socle.

## Sommaire

- [Stack](#stack)
- [Démarrage rapide](#démarrage-rapide)
- [Commandes](#commandes)
- [Variables d'environnement](#variables-denvironnement)
- [Architecture](#architecture-résumée)
- [Base de données](#base-de-données)
- [Authentification](#authentification)
- [Tests](#tests)
- [Déploiement (Vercel + Supabase)](#déploiement-vercel--supabase)
- [Choix de versions](#choix-de-versions)

## Stack

| Domaine          | Choix                                                                        |
| ---------------- | ---------------------------------------------------------------------------- |
| Langage          | TypeScript 6 (strict, `noUncheckedIndexedAccess`)                            |
| Monorepo         | pnpm workspaces + Turborepo                                                  |
| Web              | Next.js 16 (App Router, Turbopack), React 19                                 |
| Données          | PostgreSQL (Supabase en production), pilote `pg`, migrations SQL versionnées |
| Auth             | Supabase Auth (administrateur unique) + jeton agent haché pour l'ingestion   |
| Validation       | Zod 4 (contrats versionnés dans `@immotrack/contracts`)                      |
| Logs             | Pino (JSON structuré, masquage des secrets)                                  |
| Tests            | Vitest, Testing Library, Playwright                                          |
| Qualité          | ESLint 10 (typescript-eslint strict typé), Prettier, dependency-cruiser      |
| CI / Hébergement | GitHub Actions, Vercel                                                       |

Aucune API LLM n'est appelée par le backend.

## Démarrage rapide

Prérequis : Node.js ≥ 22.12 (`.nvmrc`), pnpm 10 (`corepack enable`), et **soit** le
[Supabase CLI](https://supabase.com/docs/guides/local-development) avec Docker, **soit** un
PostgreSQL ≥ 15 local.

```bash
pnpm install

# 1. Base locale (Supabase CLI : Postgres + Auth + Studio, migrations et seed appliqués)
pnpm dlx supabase start
pnpm dlx supabase status          # affiche l'URL API et la clé publiable locales

# 2. Configuration
cp .env.example apps/web/.env.local
pnpm agent:hash-token             # génère un jeton agent + son empreinte SHA-256
# → renseigner SUPABASE_PUBLISHABLE_KEY, ADMIN_EMAIL et AGENT_INGESTION_TOKEN_SHA256

# 3. Créer l'administrateur dans Supabase Studio (http://127.0.0.1:54323 > Authentication)
#    avec l'email déclaré dans ADMIN_EMAIL (l'inscription publique est désactivée).

# 4. Lancer l'application
pnpm dev                          # http://localhost:3000
```

Sans Supabase CLI : appliquer `supabase/migrations/*.sql` puis `supabase/seed.sql` sur un
PostgreSQL local (`psql -1 -f …`), pointer `DATABASE_URL` dessus et utiliser
`AUTH_MODE=disabled` (accepté uniquement hors production).

Envoyer un lot de test :

```bash
curl -X POST http://localhost:3000/api/v1/agent-ingestion \
  -H "Authorization: Bearer <jeton agent>" \
  -H "Content-Type: application/json" \
  --data @docs/api/examples/agent-ingestion.v1.json
```

## Commandes

| Commande                       | Rôle                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `pnpm dev`                     | Next.js en développement                                                       |
| `pnpm build`                   | Build de production (Turborepo)                                                |
| `pnpm lint`                    | ESLint (typé) + règles de frontières architecturales (dependency-cruiser)      |
| `pnpm typecheck`               | `tsc --noEmit` dans chaque package (+ `next typegen` pour l'app)               |
| `pnpm test`                    | Tests unitaires puis d'intégration                                             |
| `pnpm test:unit`               | Domaine, application, contrats, adaptateurs, composants (sans I/O)             |
| `pnpm test:integration`        | Repositories et route HTTP sur PostgreSQL (`TEST_DATABASE_URL`)                |
| `pnpm test:e2e`                | Build + smoke tests Playwright                                                 |
| `pnpm format` / `format:check` | Prettier                                                                       |
| `pnpm agent:hash-token`        | Génère un jeton agent et l'empreinte à configurer (ou hache l'entrée standard) |
| `pnpm contracts:generate`      | Régénère `docs/api/agent-ingestion.v1.schema.json` depuis le schéma Zod        |

## Variables d'environnement

Toutes sont lues **côté serveur uniquement** (aucune n'est préfixée `NEXT_PUBLIC_`) ; elles sont
validées au démarrage et un message d'erreur ne cite que les noms des variables, jamais leurs
valeurs. Référence complète et commentée : [`.env.example`](.env.example).

| Variable                         | Obligatoire         | Description                                                        |
| -------------------------------- | ------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`                   | oui                 | Connexion PostgreSQL (pooler Supabase en mode transaction en prod) |
| `DATABASE_POOL_MAX`              | non (3)             | Connexions par instance serverless                                 |
| `AUTH_MODE`                      | non (`supabase`)    | `disabled` uniquement en développement local                       |
| `SUPABASE_URL`                   | si `supabase`       | URL du projet Supabase                                             |
| `SUPABASE_PUBLISHABLE_KEY`       | si `supabase`       | Clé **publiable** (anon) — jamais la clé `service_role`            |
| `ADMIN_EMAIL`                    | si `supabase`       | Email de l'administrateur unique autorisé                          |
| `AGENT_INGESTION_TOKEN_SHA256`   | pour l'ingestion    | Empreintes SHA-256 des jetons agents, séparées par des virgules    |
| `AGENT_INGESTION_MAX_BODY_BYTES` | non (1 000 000)     | Taille maximale d'un lot                                           |
| `LOG_LEVEL`                      | non (`info`)        | `debug`, `info`, `warn`, `error`                                   |
| `TEST_DATABASE_URL`              | tests d'intégration | Serveur PostgreSQL où les tests créent des bases jetables          |

## Architecture résumée

Monolithe modulaire en architecture hexagonale. Les dépendances pointent vers le domaine :

```text
Domain  <-  Application  <-  Infrastructure / Presentation (apps/web)
```

```text
apps/web                     Next.js : UI, Route Handlers (adaptateurs entrants), composition root
packages/domain              Entités, value objects, politiques et calculateurs purs (aucune dépendance)
packages/application         Use cases, commandes/résultats, ports (interfaces)
packages/infrastructure      Adaptateurs : PostgreSQL, Supabase Auth, Pino, horloge, UUID, hachage
packages/contracts           Contrats d'API versionnés (Zod) : ingestion agent v1.0, erreurs HTTP
packages/test-utils          Fixtures partagées et bases PostgreSQL jetables pour les tests
supabase/                    Migrations SQL versionnées, seed non sensible, config du CLI
docs/                        Architecture, contrat d'API, ADR
```

Les frontières sont **vérifiées en CI** (`pnpm lint:architecture`) : le domaine n'importe rien,
l'application n'importe que le domaine, seul `apps/web/src/server` importe l'infrastructure,
l'UI ne contient pas de logique métier, etc. Détails : [docs/architecture.md](docs/architecture.md)
et les [ADR](docs/adr).

Tranche verticale de référence — `POST /api/v1/agent-ingestion` :

1. authentification du jeton agent (`AgentAuthenticator`) ;
2. limites (Content-Type, taille) puis validation du contrat v1.0 (`@immotrack/contracts`) ;
3. `IngestAgentBatch` : idempotence (`idempotencyKey`), validation métier des annonces via le
   domaine, enregistrement atomique de la requête, du run et des événements ;
4. réponse typée `accepted` (202) / `duplicate` (200) / rejet (4xx), avec `correlationId`.

Contrat et exemples : [docs/api/agent-ingestion.md](docs/api/agent-ingestion.md).

## Base de données

- Migrations : `supabase/migrations/<horodatage>_<nom>.sql`, appliquées dans l'ordre, jamais
  modifiées une fois mergées (toute évolution = nouvelle migration).
- Seed : `supabase/seed.sql` (référentiel de sources, critères initiaux) — rejouable, sans secret.
- Le SQL n'utilise que du PostgreSQL standard : il s'applique sur Supabase comme sur un
  PostgreSQL vierge (CI). La RLS est activée sur toutes les tables sans politique : l'accès se
  fait uniquement côté serveur via `DATABASE_URL`, jamais via l'API Data de Supabase.
- Nouvelle migration : `pnpm dlx supabase migration new <nom>`, puis `supabase db reset` en local.

## Authentification

- **Administrateur** : Supabase Auth (email + mot de passe), session SSR par cookies. Le proxy
  Next.js (`src/proxy.ts`) rafraîchit la session et redirige vers `/login` ; chaque page protégée
  revérifie la session côté serveur (`requireAdmin`). Seul `ADMIN_EMAIL` est autorisé.
- **Agents** : jeton porteur dédié, révocable. Le serveur ne connaît que l'empreinte SHA-256 ;
  plusieurs empreintes peuvent coexister pour une rotation sans interruption. L'abstraction
  `AgentAuthenticator` permet de passer plus tard à OAuth, MCP ou un flux machine-to-machine.
- La clé `service_role` n'est utilisée nulle part.

## Tests

| Niveau      | Emplacement                             | Dépendances                      |
| ----------- | --------------------------------------- | -------------------------------- |
| Unitaires   | `**/*.test.ts(x)`                       | aucune I/O, ni réseau ni base    |
| Intégration | `**/*.int.test.ts`                      | PostgreSQL (`TEST_DATABASE_URL`) |
| Composants  | `apps/web/src/components/**/*.test.tsx` | jsdom + Testing Library          |
| E2E         | `apps/web/e2e/*.spec.ts`                | build de production + Chromium   |

Les tests d'intégration créent pour chaque package une base dédiée (`immotrack_it_*`), y
appliquent **toutes les migrations et le seed** sur une base vierge, puis la suppriment.

```bash
# Avec Supabase CLI démarré :
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres pnpm test:integration
# Ou avec Docker seul :
docker run -d --name immotrack-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17-alpine
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres pnpm test:integration
```

E2E en local : `pnpm --filter @immotrack/web exec playwright install chromium` une fois, puis
`pnpm test:e2e` (ou `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` pour réutiliser un Chromium existant).

## Déploiement (Vercel + Supabase)

1. **Supabase** : créer le projet, appliquer les migrations (`supabase link` puis
   `supabase db push`), créer l'utilisateur administrateur, désactiver l'inscription publique.
2. **Vercel** : importer le dépôt avec _Root Directory_ = `apps/web` (pnpm et Turborepo sont
   détectés). Renseigner les variables d'environnement ci-dessus ; `DATABASE_URL` pointe vers le
   pooler Supabase (mode transaction, port 6543).
3. Les migrations restent une étape explicite et contrôlée (jamais au build).

## Choix de versions

Versions stables les plus récentes compatibles entre elles au 3 octobre 2026, verrouillées par
`pnpm-lock.yaml` :

- **TypeScript 6.0** et non 7.0 : typescript-eslint ne supporte pas encore TypeScript 7 (`<6.1`).
- **ESLint 10** avec `@next/eslint-plugin-next` et `eslint-plugin-react-hooks` utilisés
  directement : `eslint-config-next` embarque des plugins (react, import, jsx-a11y) limités à
  ESLint 9, désormais non supporté.
- **jsdom 29** : jsdom 30 exige Node ≥ 22.22.2, plus strict que le plancher Node 22.12 du projet.
- PostgreSQL 17 en CI (même version majeure que Supabase).
